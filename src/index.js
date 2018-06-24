import path from 'path';
import fs from 'fs';
import { URL } from 'url';

import ow from 'ow';
import got from 'got';
import normalize from 'normalize-url';

export default class ImgurAPI {
	client_id = undefined;
	client_secret = undefined;

	_genHeaders = (anonimus = false) => {
		if ( this.tkn && anonimus === false ) {
			return {
				'Authorization': `Bearer ${this.tkn}`
			}
		}

		return {
			'Authorization': `Client-ID ${this.client_id}`
		}	
	}

	_makeURL = (endpoint = '/', {
		params = {}
	} = {}) => {
		const url = new URL('https://api.imgur.com/3/')

		url.pathname += endpoint;

		for (let i=0; i<Object.keys(params).length; i++) {
			url.searchParams.set(key, params[key])
		}

		return normalize(url.href);
	}

	_tryParse = data => {
		if ( typeof data !== 'string' ) return data;

		try {
			return JSON.parse(data);
		} catch (e) {
			return data;
		}
	}

	_readFile = file => new Promise((resolve,reject) => {
		fs.readFile(file, (error, data) => {
			if ( error ) reject(error);
			resolve(data);
		})
	})



	/**
	* @param {Object} options
	* @param {String} options.client_id Set the Client ID
	* @param {String} options.client_secret Set the Client Secret
	*/
	setCredentials = ({ client_id, client_secret, token } = {}) => {
		ow(client_secret, ow.string);
		ow(client_id, ow.string);

		if (!client_secret && !client_id) {
			return new SyntaxError('Invalid client_id/client_secret!')
		}

		this.client_id = client_id;
		this.client_secret = client_secret;

		if (token) {
			ow(token, ow.string);
			this.tkn = token;
		}
	}

	token = {
		generate: () => {
			return this._makeURL('oauth2/authorize', {
				client_id: this.client_id,
				response_type: 'token'
			})
		},
		refresh: refresh_token => got(this._makeURL('oauth2/token', {
			client_id: this.client_id,
			client_secret: this.client_secret,
			grant_type: 'refresh_token',
			refresh_token,
		}))
	}

	gallery = {}
	album = {}
	comment = {}
	account = {}

	image = {
		get: async hash => {
			const url = this._makeURL(`/image/${hash}`)

			const { body } = await got(url, {
				method: 'GET',
				headers: this._genHeaders(true)
			})

			return this._tryParse(body)
		},
		upload: async (filepath, {
			album,
			type,
			name,
			title,
			description
		} = {}) => {
			const file = await this._readFile(filepath);
			const url = this._makeURL('/image', { title, type, album, description, name });

			const { body } = await got(url, {
				method: 'POST',
				json: true,
				body: {
					name,
					title,
					description,
					type,
					album,
					image: file.toString('base64')
				},
				headers: this._genHeaders(this.tkn)
			})

			return this._tryParse(body)
		},

		update: async (hash, {
			title,
			description
		} = {}) => {},

		delete: async hash => {
			const url = this._makeURL(`/image/${hash}`);
			const { body } = await got(url, {
				method: 'DELETE',
				headers: this._genHeaders()
			})

			return this._tryParse(body)
		},

		favorite: async hash => {
			if (!this.tkn) {
				return throw new Error('You must be logged in to favorite an image!')
			}

			const url = this._makeURL(`/image/${hash}/favorite`);
			const { body } = await got(url, {
				headers: this._genHeaders()
			})

			return this._tryParse(body);
		},
	}
}