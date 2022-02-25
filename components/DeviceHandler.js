import React, { useState } from 'react';

import base64 from 'react-native-base64';
import {BleManager, Device} from 'react-native-ble-plx';

export class DeviceHandler {

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

    scaleRaw: Number;
    scaleValue: Number;
    scaleFactor: Number;
    scaleOffset: Number;
    scaleRatio: Number;
    device: Device
    batteryLvl: Number;
    serialNumber: String;

    constructor() {
        this.device = null;
        this.scaleRaw = 0;
        this.scaleValue = 0;
        this.scaleFactor = 1;
        this.scaleOffset = 0;
    }

    setDevice(device: Device){
        this.device = device;
        this.initScaleConfig();
        this.subscribeConfigChar();
        this.subscirbeBatteryChar();
        this.subscribeScaleChar();
    }

    parseConfiguration(str:String){
        console.log('Device config: ', str);
  
        var configObj = JSON.parse(str);
        console.log('Device SN: ', configObj.serial);
        console.log('Device Tare Value: ', configObj.tare);
        console.log('Device Scale Factor: ', configObj.scale_factor);
        console.log('Device Rate: ', configObj.rate);

        this.scaleFactor = configObj.scale_factor;
        this.scaleOffset = configObj.tare;
        this.scaleRatio = configObj.rate;
        this.serialNumber = configObj.serial;
    }

    initScaleConfig(){
        //Message
        this.device
        .readCharacteristicForService(this._SERVICE_UUID_GRIPMETER, this._UUID_CONFIG)
        .then(valenc => {
          console.log('Init configuration: ' + base64.decode(valenc?.value));
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
              
              console.log('Battery: ', battery);
              this.batteryLvl = battery;
          }
        },
        'batterytransaction',
      );
    }

    subscribeScaleChar(){
        // Scale RAW value Callback (notification)
        this.device.monitorCharacteristicForService(
            this._SERVICE_UUID_GRIPMETER,
            this._UUID_SCALE,
            (error, characteristic) => {
            if (characteristic?.value != null) 
            {
                var str = base64.decode(characteristic?.value);
                var hexBuffer = [];
                for (var n = str.length - 1; n >= 0; n --) 
                   {                 
                  var hexDigit = Number(str.charCodeAt(n)).toString(16);
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
                 //console.log('rawScaleValue: ', this.scaleRaw);
                
                 // phyValue = ((float)scaleValue - _tare)/(float)_scaleFactor;
                 this.scaleValue = (this.scaleRaw - this.scaleOffset) / this.scaleFactor;
                 
                 //console.log('Tare: ', scaleTare, ' Factor: ', scaleFactor, ' HEX: ', hexString, ' Raw: ', scaleValue, ' PHY: ', scaleValuePhy.toFixed(2));
                
                 console.log('Scale Value: ' + this.scaleValue.toFixed(2) + 'kg');
            }
            },
            'scaletransaction',
        );
      }

  }