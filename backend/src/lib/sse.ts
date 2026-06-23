import { EventEmitter } from 'events';

class RunEventEmitter extends EventEmitter {}
export const runEmitter = new RunEventEmitter();

// To prevent memory leaks, we can increase the max listeners if many runs happen concurrently
runEmitter.setMaxListeners(100);
