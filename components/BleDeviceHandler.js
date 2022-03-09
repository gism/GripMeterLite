import React, { useState } from 'react';

import base64 from 'react-native-base64';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
  LogLevel,
} from 'react-native-ble-plx';

export type BluetoothPeripheral = {
  id: string;
  name: string;
  serviceUUIDs: Array<string>;
};

class BleDeviceHandler {

    // GripMeter UUID:
    _SERVICE_UUID_GRIPMETER = '7e4e1701-1ea6-40c9-9dcc-13d34ffead57';
    _UUID_SCALE = '7e4e1703-1ea6-40c9-9dcc-13d34ffead57';
    _UUID_CONFIG = '7e4e1702-1ea6-40c9-9dcc-13d34ffead57';
    _UUID_BAT = '7e4e1704-1ea6-40c9-9dcc-13d34ffead57';

    _SHORT_BUZZ = '{"ID":"cmd","data":"short_buzz"}';
    _LONG_BUZZ = '{"ID":"cmd","data":"long_buzz"}';
    _DOUBLE_BUZZ = '{"ID":"cmd","data":"double_buzz"}';
    _DISPLAY_SMILE = '{"ID":"cmd","data":"disp_smile"}';

    // {\"ID\":\"scale_factor\",\"data\":\"" + deviceFactorView.getText() + "\"}
    // "{\"ID\":\"tare\",\"data\":\"" + currentScaleValue.toString() + "\"}";

    bleManager: BleManager;
    device: Device | null;
    scaleRaw: Number;
    scaleValue: Number;
    scaleFactor: Number;
    scaleOffset: Number;
    scaleRatio: Number;
    batteryLvl: Number;
    serialNumber: String;
    configInit: Boolean;
    basetime: Number;

    constructor() {

      // First step is to create BleManager which should be used as an entry point
      // to __ALL__ BLE related functionalities!
      // No additional BleManager Class should be created
      this.bleManager = new BleManager();
      this.bleManager.setLogLevel(LogLevel.Verbose);              // Otherwise console is flood with non-sense
      console.log('BleDeviceHandler and BleManager created!');

      this.device = null;
      this.scaleRaw = 0;
      this.scaleValue = 0;
      this.scaleFactor = 1;
      this.scaleOffset = 0;
      this.configInit = false;
      this.basetime = Date.now();
    }

    setDevice(device: Device){

      this.device = device;
      this.initScaleConfig()

      console.log("Device: " + this.device.name + " (" + this.device.id + ")");

      //this.initScaleConfig();
      //this.subscribeConfigChar();
      //this.subscirbeBatteryChar();
      //this.subscribeScaleChar();
    }

    stopScanningForPeripherals = () => {
      console.log('BleDeviceHandler.stopScanningForPeripherals!');
      this.bleManager.stopDeviceScan();
    };

    parseScaleValue(dataStr: String)
    {
      if(!this.configInit){
        return
      }

      let scaleValue: number = -1;
      let hexBuffer = [];
      for (var n = dataStr.length - 1; n >= 0; n --) 
         {                 
        let hexDigit = Number(dataStr.charCodeAt(n)).toString(16);
        if (hexDigit.length == 1) {
          hexDigit = '0' + hexDigit;
       }
        hexBuffer.push(hexDigit);
       }
       var hexString = hexBuffer.join('');
       this.scaleRaw = parseInt(hexString, 16);
       
       //var this.scaleRaw = parseInt('0x'+hexString.match(/../g).reverse().join(''));   // Easy way to change endian

       // Scale Value is signed:
       if (this.scaleRaw & 0x80000000){
          this.scaleRaw = this.scaleRaw - 0x100000000;
       }
      
       // Code from firmware:
       // phyValue = ((float)scaleValue - _tare)/(float)_scaleFactor;
       scaleValue = (this.scaleRaw - this.scaleOffset) / this.scaleFactor;
       
       //console.log('Tare: ', scaleTare, ' Factor: ', scaleFactor, ' HEX: ', hexString, ' Raw: ', scaleValue, ' PHY: ', scaleValuePhy.toFixed(2));
       this.scaleValue = scaleValue.toFixed(2);
       //let t = Date.now() - this.basetime;
       //console.log(t + ' ms Scale Value: ' + this.scaleValue + 'kg');
    }

    // Callback when SCALE value (BLE Characteristic notification)
    onScaleValueUpdate = (
      error: BleError | null,
      characteristic: Characteristic | null,
      emitter: (arg0: {payload: number | BleError}) => void,
    ) => {

      if (error) {
        emitter({payload: error});
      }
      
      const dataStr = base64.decode(characteristic?.value ?? '');
      this.parseScaleValue(dataStr);

      emitter({payload: this.scaleValue});
    };

    parseConfiguration(str:String){

      try {
        var configObj = JSON.parse(str);
        console.log('Device SN: ', configObj.serial);
        console.log('Device Tare Value: ', configObj.tare);
        console.log('Device Scale Factor: ', configObj.scale_factor);
        console.log('Device Rate: ', configObj.rate);

        this.scaleFactor = configObj.scale_factor;
        this.scaleOffset = configObj.tare;
        this.scaleRatio = configObj.rate;
        this.serialNumber = configObj.serial;
        this.configInit = true;

      } catch (e) {
        console.log('ERROR (JSON.parse) | Device config: ', str);
      }

  }

    // Callback when CONFIG value (BLE Characteristic notification)
    onConfigValueUpdate = (
      error: BleError | null,
      characteristic: Characteristic | null,
      emitter: (arg0: {payload: number | BleError}) => void,
    ) => {

      if (error) {
        emitter({payload: error});
      }
      
      const dataStr = base64.decode(characteristic?.value ?? '');

      console.log("New BLE configuration: " + dataStr);
      this.parseConfiguration(dataStr);

      // TODO: RETURN SCUCCEED PAYLOAD?
      emitter({payload: this.scaleValue});
    };

    // Callback when Battery value (BLE Characteristic notification)
    onBatteryValueUpdate = (
      error: BleError | null,
      characteristic: Characteristic | null,
      emitter: (arg0: {payload: number | BleError}) => void,
    ) => {

      if (error) {
        emitter({payload: error});
      }
      
      const dataStr = base64.decode(characteristic?.value ?? '');

      var hexBuffer = [];
      for (var n = dataStr.length - 1; n >= 0; n --) 
          {                 
        var hexDigit = Number(dataStr.charCodeAt(n)).toString(16);
        hexBuffer.push(hexDigit);
        }
        var hexString = hexBuffer.join('');
        var battery = parseInt(hexString, 16);
        
        console.log('Battery: ', battery);
        this.batteryLvl = battery;

      // TODO: RETURN SCUCCEED PAYLOAD?
      emitter({payload: this.scaleValue});
    };

    startStreamingScaleData = async (
      emitter: (arg0: {payload: number | BleError}) => void,
    ) => {

      //this.device.monitorCharacteristicForService(
      this.bleManager.monitorCharacteristicForDevice(
        this.device.id,
        this._SERVICE_UUID_GRIPMETER,
        this._UUID_SCALE,
        (error, characteristic) =>
          this.onScaleValueUpdate(error, characteristic, emitter),
        'scalebletransaction',
      );
    };

    startStreamingConfigData = async (
      emitter: (arg0: {payload: number | BleError}) => void,
    ) => {

      this.device.monitorCharacteristicForService(
        this._SERVICE_UUID_GRIPMETER,
        this._UUID_CONFIG,
        (error, characteristic) =>
          this.onConfigValueUpdate(error, characteristic, emitter),
        'configbletransaction',
      );
    };

    startStreamingBatteryData = async (
      emitter: (arg0: {payload: number | BleError}) => void,
    ) => {
      //this.device.monitorCharacteristicForService(
      this.bleManager.monitorCharacteristicForDevice(
        this.device.id,
        this._SERVICE_UUID_GRIPMETER,
        this._UUID_BAT,
        (error, characteristic) =>
          this.onBatteryValueUpdate(error, characteristic, emitter),
        'batterybletransaction',
      );
    };

    initScaleConfig(){
        //Message
        this.device
        .readCharacteristicForService(this._SERVICE_UUID_GRIPMETER, this._UUID_CONFIG)
        .then(valenc => {
          var initConfig = base64.decode(valenc?.value);
          this.parseConfiguration(initConfig);
        });
      }

    subscribeConfigChar(){
      // Config value Callback (notification)
      this.device.monitorCharacteristicForService(
        this._SERVICE_UUID_GRIPMETER,
        this._UUID_CONFIG,
        (error, characteristic) => {
          if (characteristic?.value != null) 
          {
            var str = base64.decode(characteristic?.value);
            parseConfiguration(str);
          }
          else
          {
            console.log('ERROR: Null Configuration');
          }
        },
        'deviceConfigTransaction',
      );
    }

    subscirbeBatteryChar(){
      // Battery value Callback (notification)
      this.device.monitorCharacteristicForService(
        this._SERVICE_UUID_GRIPMETER,
        this._UUID_BAT,
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
              this.batteryLvl = battery;
          }
        },
        'batterytransaction',
      );
    }

    //Function to Config json to GripMeter
    sendConfig(value: string) {
      this.bleManager.writeCharacteristicWithResponseForDevice(
        this.device?.id,
        this._SERVICE_UUID_GRIPMETER,
        this._UUID_CONFIG,
        base64.encode(value),
      ).then(characteristic => {
        console.log('Send config:', base64.decode(characteristic.value));
      });
    }

    sendDoubleBuzzer(){
      sendConfig(this._DOUBLE_BUZZ);
    }

  }

const bleDeviceHandler = new BleDeviceHandler();
export default bleDeviceHandler;  

