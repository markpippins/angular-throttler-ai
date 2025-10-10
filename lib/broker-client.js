// broker-client.js

const BROKER_URL = 'http://localhost:8080/api/broker/submitRequest';

/**
 * Generates a UUID.
 * @returns {string} A new UUID.
 */
function generateUUID() {
    var d = new Date().getTime();
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;
        if(d > 0){
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/**
 * Submits a request to the broker.
 * @param {string} service The name of the service.
 * @param {string} operation The name of the operation.
 * @param {object} params The parameters for the operation.
 * @returns {Promise<any>} A promise that resolves with the data from the service response.
 * @throws {Error} If the request fails or the service returns an error.
 */
async function submitRequest(service, operation, params = {}) {
    const request = {
        service,
        operation,
        params,
        requestId: generateUUID()
    };

    const response = await fetch(BROKER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Broker request failed with status ${response.status}: ${errorBody}`);
    }

    const serviceResponse = await response.json();

    if (serviceResponse.ok) {
        return serviceResponse.data;
    } else {
        const errorDetails = serviceResponse.errors.map(e => e.message || `${e.code}: ${e.path}`).join(', ');
        throw new Error(`Service operation ${service}/${operation} failed: ${errorDetails}`);
    }
}

export { submitRequest };
