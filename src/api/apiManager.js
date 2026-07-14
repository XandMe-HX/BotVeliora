const axios = require('axios');
const chalk = require('chalk');

class ApiManager {
    async fetchWithFallback(urlArray, params = {}, options = {}) {
        for (let i = 0; i < urlArray.length; i++) {
            const url = urlArray[i];
            try {
                const response = await axios({
                    url,
                    method: options.method || 'GET',
                    params,
                    timeout: options.timeout || 15000,
                    ...options
                });
                return response.data;
            } catch (err) {
                console.error(chalk.yellow(`[API Manager] Failed to fetch from ${url} - Error: ${err.message}`));
                if (i === urlArray.length - 1) {
                    throw new Error('All API providers failed.');
                }
            }
        }
    }
}

module.exports = new ApiManager();
