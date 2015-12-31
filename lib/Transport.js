'use strict';

const EventEmitter = require('events').EventEmitter;

const logger = require('./logger')('Transport');
const utils = require('./utils');
const errors = require('./errors');

class Transport extends EventEmitter
{
	constructor(options, data, channel)
	{
		logger.debug('constructor() [options:%o, data:%o]', options, data);

		super();

		// Room identificator
		this._roomId = options.roomId;

		// Peer identificator
		this._peerId = options.peerId;

		// Transport identificator
		this._transportId = options.transportId;

		// Transport data provided by the worker
		this._data = data;

		// Channel instance
		this._channel = channel;

		// Closed flag
		this._closed = false;

		// TODO: subscribe to channel notifications from the worker
	}

	/**
	 * Close the Transport
	 */
	close(error, dontSendChannel)
	{
		logger.debug('close() [error:%s]', error);

		if (this._closed)
			return;

		this._closed = true;

		if (!dontSendChannel)
		{
			let data =
			{
				roomId      : this._roomId,
				peerId      : this._peerId,
				transportId : this._transportId
			};

			// Send Channel request
			this._channel.request('closeTransport', data)
				.then(() =>
				{
					logger.debug('"closeTransport" request succeeded');
				})
				.catch((error) =>
				{
					logger.error('"closeTransport" request failed [status:%s, error:"%s"]', error.status, error.message);
				});
		}

		this.emit('close', error);
	}

	get iceComponent()
	{
		return this._data.iceComponent;
	}

	getIceLocalParameters()
	{
		return this._data.iceLocalParameters;
	}

	getIceLocalCandidates()
	{
		return this._data.iceLocalCandidates;
	}

	createAssociatedTransport()
	{
		logger.debug('createAssociatedTransport()');

		if (this._closed)
			return Promise.reject(errors.Closed('transport closed'));

		let options =
		{
			roomId         : this._roomId,
			peerId         : this._peerId,
			transportId    : utils.randomNumber(),
			rtpTransportId : this._transportId
		};

		return this._channel.request('createAssociatedTransport', options)
			.then((data) =>
			{
				logger.debug('"createAssociatedTransport" request succeeded');

				// Create a Transport instance
				let transport = new Transport(options, data, this._channel);

				// Emit 'associatedtransport' so the owner Peer can handle this new
				// transport
				this.emit('associatedtransport', transport);

				return transport;
			})
			.catch((error) =>
			{
				logger.error('"createAssociatedTransport" request failed [status:%s, error:"%s"]', error.status, error.message);

				throw error;
			});
	}
}

module.exports = Transport;