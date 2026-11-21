const { EventEmitter } = require("node:events");

// Application event bus built on Node's EventEmitter.
// emit() schedules listeners with setImmediate, so they run asynchronously,
// after the HTTP response is already on its way: a slow or failing listener
// never delays or breaks the request that caused the event.
function createEventBus() {
    const emitter = new EventEmitter();

    return {
        emit(eventName, payload) {
            setImmediate(() => emitter.emit(eventName, payload));
        },

        on(eventName, listener) {
            emitter.on(eventName, async payload => {
                try {
                    await listener(payload);
                } catch (err) {
                    console.error(`[events] listener for "${eventName}" failed:`, err.message);
                }
            });
        }
    };
}

module.exports = { createEventBus };
