import { PermissionsAndroid, Platform } from 'react-native';
import { buffers, eventChannel } from 'redux-saga';
import {
  fork,
  cancel,
  take,
  call,
  put,
  race,
  cancelled,
  actionChannel,
} from 'redux-saga/effects';
import {
  log,
  logError,
  updateConnectionState,
  bleStateUpdated,
  testFinished,
  type BleStateUpdatedAction,
  type UpdateConnectionStateAction,
  type ConnectAction,
  type ExecuteTestAction,
  sensorTagFound,
  ConnectionState,
  updateScaleValue,
} from './Reducer';
import {
  BleManager,
  BleError,
  Device,
  State,
  LogLevel,
} from 'react-native-ble-plx';
import bleDeviceHandler from './BleDeviceHandler';

import { SensorTagTests } from './Tests';

export function* bleSaga(): Generator<*, *, *> {
  yield put(log('BLE saga started...'));

  // First step is to create BleManager which should be used as an entry point
  // to all BLE related functionalities
  //const manager = new BleManager();             // Now this is managed at bleDeviceHandler
  //manager.setLogLevel(LogLevel.Verbose);        // Now this is managed at bleDeviceHandler

  // All below generators are described below...
  yield fork(handleBleDeviceScanning, bleDeviceHandler.bleManager);
  yield fork(handleBleState, bleDeviceHandler.bleManager);
  yield fork(handleBleConnection, bleDeviceHandler.bleManager);
  
}

// This generator tracks our BLE state. Based on that we can enable scanning, get rid of devices etc.
// eventChannel allows us to wrap callback based API which can be then conveniently used in sagas.
function* handleBleState(manager: BleManager): Generator<*, *, *> {
  const stateChannel = yield eventChannel((emit) => {
    const subscription = manager.onStateChange((state) => {
      emit(state);
    }, true);
    return () => {
      subscription.remove();
    };
  }, buffers.expanding(1));

  try {
    for (; ;) {
      const newState = yield take(stateChannel);
      yield put(bleStateUpdated(newState));
    }
  } finally {
    if (yield cancelled()) {
      stateChannel.close();
    }
  }
}

// This generator decides if we want to start or stop scanning depending on specific
// events:
// * BLE state is in PoweredOn state
// * Android's permissions for scanning are granted
// * We already scanned device which we wanted
function* handleBleDeviceScanning(manager: BleManager): Generator<*, *, *> {
  var scanTask = null;
  var bleState: $Keys<typeof State> = State.Unknown;
  var connectionState: $Keys<typeof ConnectionState> = ConnectionState.DISCONNECTED;

  const channel = yield actionChannel([
    'BLE_STATE_UPDATED',
    'UPDATE_CONNECTION_STATE',
  ]);

  for (; ;) {
    const action:
      | BleStateUpdatedAction
      | UpdateConnectionStateAction = yield take(channel);

    switch (action.type) {
      case 'BLE_STATE_UPDATED':
        bleState = action.state;
        break;
      case 'UPDATE_CONNECTION_STATE':
        connectionState = action.state;
        break;
    }

    const enableScanning =
      bleState === State.PoweredOn &&
      (connectionState === ConnectionState.DISCONNECTING ||
        connectionState === ConnectionState.DISCONNECTED);

    if (enableScanning) {
      if (scanTask != null) {
        yield cancel(scanTask);
      }
      scanTask = yield fork(scan, manager);
    } else {
      if (scanTask != null) {
        yield cancel(scanTask);
        scanTask = null;
      }
    }
  }
}

// As long as this generator is working we have enabled scanning functionality.
// When we detect SensorTag device we make it as an active device.
function* scan(manager: BleManager): Generator<*, *, *> {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    yield put(log('Scanning: Checking permissions...'));
    const enabled = yield call(
      PermissionsAndroid.check,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (!enabled) {
      yield put(log('Scanning: Permissions disabled, showing...'));
      const granted = yield call(
        PermissionsAndroid.request,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        yield put(log('Scanning: Permissions not granted, aborting...'));
        // TODO: Show error message?
        return;
      }
    }
  }
  console.log('BLE: Scanning started...');
  yield put(log('Scanning started...'));
  const scanningChannel = yield eventChannel((emit) => {
    manager.startDeviceScan(
      null,
      { allowDuplicates: true },
      (error, scannedDevice) => {

        if (error) {
          console.log('manager.startDeviceScan --> ERROR');
          emit([error, scannedDevice]);
          return;
        }

        //console.log('manager.startDeviceScan --> found: ', scannedDevice.localName);
        if (scannedDevice != null && scannedDevice.localName?.toLowerCase()?.includes('gripmeter')) {  // SensorTag
          
          // TO DO: Manage avaiable devices list!
          //const isDuplicate = state.availableDevices.some(
          //  device => device.id === action.payload.id,
          //);
          //if (!isDuplicate) {
          //  state.availableDevices = state.availableDevices.concat(action.payload);
          //}
          
          emit([error, scannedDevice]);
        }
      },
    );
    return () => {
      manager.stopDeviceScan();
    };
  }, buffers.expanding(1));

  try {
    for (; ;) {
      const [error, scannedDevice]: [?BleError,?Device] = yield take(
        scanningChannel,
      );
      if (error != null) {
      }
      if (scannedDevice != null) {
        yield put(sensorTagFound(scannedDevice));
      }
    }
  } catch (error) {
  } finally {
    yield put(log('Scanning stopped...'));
    if (yield cancelled()) {
      scanningChannel.close();
    }
  }
}

function* handleBleConnection(manager: BleManager): Generator<*, *, *> {
  var testTask = null;

  for (; ;) {
    // Take action
    const { device }: ConnectAction = yield take('CONNECT');

    const disconnectedChannel = yield eventChannel((emit) => {
      const subscription = device.onDisconnected((error) => {
        emit({ type: 'DISCONNECTED', error: error });
      });
      return () => {
        subscription.remove();
      };
    }, buffers.expanding(1));

    const deviceActionChannel = yield actionChannel([
      'DISCONNECT',
      'EXECUTE_TEST',
      'UPDATE_SCALE_VALUE',
    ]);

    try {
      yield put(updateConnectionState(ConnectionState.CONNECTING));
      yield call([device, device.connect, {requestMTU:303}]);             // TODO: Not working?
      yield put(updateConnectionState(ConnectionState.DISCOVERING));
      yield call([device, device.discoverAllServicesAndCharacteristics]);
      yield put(updateConnectionState(ConnectionState.CONNECTED));

      if (device == null){
        yield put(log('ERROR: Device Null'));
      }else{
        yield put(log('OK: Device not Null'));
      }
      
      bleDeviceHandler.setDevice(device);            //yield call(bleDeviceHandler.setDevice, device);
      
      yield fork(handleGetScaleValuesUpdates); 
      yield fork(handleGetBatteryValuesUpdates);
      yield fork(handleGetConfigValuesUpdates);
      
      for (; ;) {
        const { deviceAction, disconnected } = yield race({
          deviceAction: take(deviceActionChannel),
          disconnected: take(disconnectedChannel),
        });

        if (deviceAction) {
          if (deviceAction.type === 'DISCONNECT') {
            yield put(log('Disconnected by user...'));
            yield put(updateConnectionState(ConnectionState.DISCONNECTING));
            yield call([device, device.cancelConnection]);
            break;
          }
          if (deviceAction.type === 'EXECUTE_TEST') {

            if (testTask != null) {
              yield cancel(testTask);
            }
            testTask = yield fork(executeTest, device, deviceAction);
          }

          if (deviceAction.type === 'UPDATE_SCALE_VALUE'){
            console.log("SAGA: Before fork: UPDATE_SCALE_VALUE: " + deviceAction.command);
            //yield fork(bleDeviceHandler.send, deviceAction.command);
          }

        } else if (disconnected) {
          yield put(log('Disconnected by device...'));
          if (disconnected.error != null) {
            yield put(logError(disconnected.error));
          }
          break;
        }
      }
    } catch (error) {
      yield put(logError(error));
    } finally {
      disconnectedChannel.close();
      yield put(testFinished());
      yield put(updateConnectionState(ConnectionState.DISCONNECTED));
    }
  }
}



function* handleGetScaleValuesUpdates(): Generator<AnyAction, void, TakeableHeartRate> {

  yield put(log('handleGetScaleValuesUpdates: started...'));

  const onScaleValueUpdate = () =>
    eventChannel(emitter => {
      bleDeviceHandler.startStreamingScaleData(emitter);

      return () => {
        bleDeviceHandler.stopScanningForPeripherals();
      };
    });

    const channel: TakeableChannel<string> = yield call(onScaleValueUpdate);

    try {
      while (true) {
        const response = yield take(channel);
        yield put(updateScaleValue(response.payload));
      }
    } catch (e) {
      console.log(e);
    }
}

function* handleGetConfigValuesUpdates(): Generator<AnyAction, void, TakeableHeartRate> {

  const onConfigValueUpdate = () =>
    eventChannel(emitter => {
      bleDeviceHandler.startStreamingConfigData(emitter);

      return () => {
        // bleDeviceHandler.stopScanningForPeripherals();
      };
    });

    const channel: TakeableChannel<string> = yield call(onConfigValueUpdate);

    try {
      while (true) {
        const response = yield take(channel);
        //yield put({
        //  type: sagaActionConstants.UPDATE_HEART_RATE,
        //  payload: response.payload,
        //});
      }
    } catch (e) {
      console.log(e);
    }
}

function* handleGetBatteryValuesUpdates(): Generator<AnyAction, void, TakeableHeartRate> {

  yield put(log('handleGetBatteryValuesUpdates: started...'));

  const onBatteryValueUpdate = () =>
    eventChannel(emitter => {
      bleDeviceHandler.startStreamingBatteryData(emitter);

      return () => {
        // bleDeviceHandler.stopScanningForPeripherals();
      };
    });

    const channel: TakeableChannel<string> = yield call(onBatteryValueUpdate);

    try {
      while (true) {
        const response = yield take(channel);
        //yield put({
        //  type: sagaActionConstants.UPDATE_HEART_RATE,
        //  payload: response.payload,
        //});
      }
    } catch (e) {
      console.log(e);
    }
}














function* executeTest(
  device: Device,
  test: ExecuteTestAction,
): Generator<*, *, *> {
  yield put(log('Executing test: ' + test.id));
  const start = Date.now();
  const result = yield call(SensorTagTests[test.id].execute, device);
  if (result) {
    yield put(
      log('Test finished successfully! (' + (Date.now() - start) + ' ms)'),
    );
  } else {
    yield put(log('Test failed! (' + (Date.now() - start) + ' ms)'));
  }
  yield put(testFinished());
}