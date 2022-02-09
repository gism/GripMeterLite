import React, {useState} from 'react';
import {
  TouchableOpacity,
  Button,
  PermissionsAndroid,
  View,
  Text,
  Image,
} from 'react-native';

import Home from './screens/Home'

// TODO: 
// Insert chart
// https://githubhelp.com/JesperLekland/react-native-svg-charts
// Example:
// https://github.com/catarizea/bvm-ventilator-covid/tree/blog-post-ble-client

//import AppLogo from './assets/gripmeter_lite.svg';

import base64 from 'react-native-base64';

import CheckBox from '@react-native-community/checkbox';

import {BleManager, Device} from 'react-native-ble-plx';
import {styles} from './Styles/styles';
import {LogBox} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const BLTManager = new BleManager();

// Original example:
// const SERVICE_UUID_GRIPMETER = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
// const UUID_SCALE = '6d68efe5-04b6-4a85-abc4-c2670b7bf7fd';
// const UUID_CONFIG = 'f27b53ad-c63d-49a0-8c0f-9f297e6cc520';


// GripMeter UUID:
const SERVICE_UUID_GRIPMETER = '7e4e1701-1ea6-40c9-9dcc-13d34ffead57';
const UUID_SCALE = '7e4e1703-1ea6-40c9-9dcc-13d34ffead57';
const UUID_CONFIG = '7e4e1702-1ea6-40c9-9dcc-13d34ffead57';
const UUID_BAT = '7e4e1704-1ea6-40c9-9dcc-13d34ffead57';

const SHORT_BUZZ = '{"ID":"cmd","data":"short_buzz"}'
const LONG_BUZZ = '{"ID":"cmd","data":"long_buzz"}'
const DOUBLE_BUZZ = '{"ID":"cmd","data":"double_buzz"}'
const DISPLAY_SMILE = '{"ID":"cmd","data":"disp_smile"}'

// {\"ID\":\"scale_factor\",\"data\":\"" + deviceFactorView.getText() + "\"}
// "{\"ID\":\"tare\",\"data\":\"" + currentScaleValue.toString() + "\"}";


var scaleValuePhy = 0.0;
var scaleFactor = 1;
var scaleTare = 0;

function StringToBool(input: String) {
  if (input == '1') {
    return true;
  } else {
    return false;
  }
}

function BoolToString(input: boolean) {
  if (input == true) {
    return '1';
  } else {
    return '0';
  }
}

export default function App() {
  //Is a device connected?
  const [isConnected, setIsConnected] = useState(false);

  //What device is connected?
  const [connectedDevice, setConnectedDevice] = useState<Device>();

  const [message, setMessage] = useState('Nothing Yet');
  const [boxvalue, setBoxValue] = useState(false);

  const [deviceBattery, setDeviceBattery] = useState('Unkown');


  // Scans availbale BLT Devices and then call connectDevice
  async function scanDevices() {
    
    console.log('HOLA: Connect button onClick()');

    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permission Localisation Bluetooth',
        message: 'Requirement for Bluetooth',
        buttonNeutral: 'Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    ).then(answere => {
      console.log('scanning');
      // display the Activityindicator

      BLTManager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.warn(error);
        }

        //if (scannedDevice && scannedDevice.name == 'BLEExample') {
        if (scannedDevice && scannedDevice.name == 'GripMeter') {          
        BLTManager.stopDeviceScan();
          connectDevice(scannedDevice);
        }
      });

      // stop scanning devices after 5 seconds
      setTimeout(() => {
        BLTManager.stopDeviceScan();
      }, 5000);
    });
  }

  // handle the device disconnection (poorly)
  async function disconnectDevice() {
    console.log('Disconnecting start');

    if (connectedDevice != null) {
      const isDeviceConnected = await connectedDevice.isConnected();
      if (isDeviceConnected) {
        BLTManager.cancelTransaction('messagetransaction');
        BLTManager.cancelTransaction('nightmodetransaction');

        BLTManager.cancelDeviceConnection(connectedDevice.id).then(() =>
          console.log('DC completed'),
        );
      }

      const connectionStatus = await connectedDevice.isConnected();
      if (!connectionStatus) {
        setIsConnected(false);
      }
    }
  }

  //Function to send data to ESP32
  async function sendBoxValue(value: boolean) {
    BLTManager.writeCharacteristicWithResponseForDevice(
      connectedDevice?.id,
      SERVICE_UUID_GRIPMETER,
      UUID_CONFIG,
      base64.encode(value.toString()),
    ).then(characteristic => {
      console.log('Boxvalue changed to :', base64.decode(characteristic.value));
    });
  }

  //Function to Config json to GripMeter
  async function sendConfig(value: string) {
    BLTManager.writeCharacteristicWithResponseForDevice(
      connectedDevice?.id,
      SERVICE_UUID_GRIPMETER,
      UUID_CONFIG,
      base64.encode(value),
    ).then(characteristic => {
      console.log('Send config:', base64.decode(characteristic.value));
    });
  }

  //Connect the device and start monitoring characteristics
  async function connectDevice(device: Device) {
    console.log('connecting to Device:', device.name);

    device
      //.connect()
      .connect({requestMTU:303})    // Request MTU 303 (Same as default). Just in case
      .then(device => {
        setConnectedDevice(device);
        setIsConnected(true);
        return device.discoverAllServicesAndCharacteristics();
      })
      .then(device => {
        //  Set what to do when DC is detected
        BLTManager.onDeviceDisconnected(device.id, (error, device) => {
          console.log('Device disconnected!');
          setIsConnected(false);
        });

        //Read inital values

        //Message
        device
          .readCharacteristicForService(SERVICE_UUID_GRIPMETER, UUID_SCALE)
          .then(valenc => {
            setMessage(base64.decode(valenc?.value));
          });

        //Read device Configuration
        device
          .readCharacteristicForService(SERVICE_UUID_GRIPMETER, UUID_CONFIG)
          .then(valenc => {
            var str = base64.decode(valenc?.value);

            console.log('Init config: ', str);

            var configObj = JSON.parse(str);
            console.log('Device SN: ', configObj.serial);
            console.log('Device Tare Value: ', configObj.tare);
            console.log('Device Scale Factor: ', configObj.scale_factor);
            console.log('Device Rate: ', configObj.rate);

            scaleFactor = configObj.scale_factor;
            scaleTare = configObj.tare;

            setBoxValue(StringToBool(str));
          });

        //monitor values and tell what to do when receiving an update

        // Scale value Callback (notification)
        device.monitorCharacteristicForService(
          SERVICE_UUID_GRIPMETER,
          UUID_SCALE,
          (error, characteristic) => {
            if (characteristic?.value != null) 
            {
              var str = base64.decode(characteristic?.value);
              var hexBuffer = [];
              for (var n = str.length - 1; n >= 0; n --) 
                 {                 
                var hexDigit = Number(str.charCodeAt(n)).toString(16);
                hexBuffer.push(hexDigit);
               }
               var hexString = hexBuffer.join('');
               var scaleValue = parseInt(hexString, 16);
               
               //var scaleValue = parseInt('0x'+hexString.match(/../g).reverse().join(''));   // Easy way to change endian

               // Scale Value is signed:
               if (scaleValue & 0x7FFFFFFF){
                scaleValue = scaleValue - 0x100000000;
               }
               //console.log('rawScaleValue: ', scaleValue);
              
               // phyValue = ((float)scaleValue - _tare)/(float)_scaleFactor;
               scaleValuePhy = (scaleValue - scaleTare) / scaleFactor;
               // setMessage('RAW: ' + scaleValue + ' PHY: ' + scaleValuePhy.toFixed(2) + 'kg');
               setMessage(scaleValuePhy.toFixed(2) + 'kg');
            }
          },
          'messagetransaction',
        );

        // Battery value Callback (notification)
        device.monitorCharacteristicForService(
          SERVICE_UUID_GRIPMETER,
          UUID_BAT,
          (error, characteristic) => {
            if (characteristic?.value != null) 
            {
              var str = base64.decode(characteristic?.value);
              var hexBuffer = [];
              for (var n = str.length - 1; n >= 0; n --) 
                  {                 
                var hexDigit = Number(str.charCodeAt(n)).toString(16);
                hexBuffer.push(hexDigit);
                }
                var hexString = hexBuffer.join('');
                var battery = parseInt(hexString, 16);
                
                //console.log('Battery: ', battery);
                setDeviceBattery('Bat: ' + battery + '%');
            }
          },
          'batterytransaction',
        );

        // Config value Callback (notification)
        device.monitorCharacteristicForService(
          SERVICE_UUID_GRIPMETER,
          UUID_CONFIG,
          (error, characteristic) => {
            if (characteristic?.value != null) 
            {
              var str = base64.decode(characteristic?.value);
              console.log('device config: ', str);
              //setDeviceBattery('Bat: ' + battery + '%');
            }
          },
          'deviceConfigTransaction',
        );


        //BoxValue
        device.monitorCharacteristicForService(
          SERVICE_UUID_GRIPMETER,
          UUID_CONFIG,
          (error, characteristic) => {
            if (characteristic?.value != null) {
              setBoxValue(StringToBool(base64.decode(characteristic?.value)));
              console.log(
                'Box Value update received2: ',
                base64.decode(characteristic?.value),
              );
            }
          },
          'boxtransaction',
        );

        console.log('Connection established');
      });
  }

  return (

      <SafeAreaView>

          

      <Home 
        connectFunction = { () => { scanDevices() } }
        disconnectFunction = { () => { disconnectDevice() } }
        isConnected = { isConnected }
        deviceValue = { message }
        deviceBattery =  { deviceBattery }
        buzzFunction = { () => { 
          console.log('HOLA: send Buzzer');
          sendConfig(DOUBLE_BUZZ) } }
      />

    </SafeAreaView>    
  );
}
