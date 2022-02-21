// @flow

import {createStore, applyMiddleware} from 'redux';
import createSagaMiddleware from 'redux-saga';
import {reducer} from './Reducer.js';
import {bleSaga} from './Saga';


// Example: How to use react-saga with BLE library:
// https://github.com/PolideaPlayground/SensorTag

const sagaMiddleware = createSagaMiddleware();
export const store = createStore(reducer, applyMiddleware(sagaMiddleware));
sagaMiddleware.run(bleSaga);
