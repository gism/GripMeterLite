import React, {useState} from 'react';
import {Provider} from 'react-redux';
import {
  TouchableOpacity,
  Button,
  PermissionsAndroid,
  View,
  Text,
  Image,
} from 'react-native';

import MainStack from './navigation/MainStack';
import { store } from './components/Store';


// TODO: 
// Insert chart
// https://githubhelp.com/JesperLekland/react-native-svg-charts
// Example:
// https://github.com/catarizea/bvm-ventilator-covid/tree/blog-post-ble-client
// BLE Listeners example:
// https://github.com/catarizea/bvm-ventilator-covid


// Tutorial: https://www.youtube.com/channel/UCVIbRw_-6VgrYbS6cbs0Bkw/videos


// Alternative BLE library
// https://github.com/innoveit/react-native-ble-manager

// More examples
// https://medium.com/tribalscale/building-an-app-with-react-native-bluetooth-low-energy-and-redux-saga-c75d9214179c

import {LogBox} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

LogBox.ignoreLogs(['new NativeEventEmitter']);    // Ignore log notification by message
LogBox.ignoreAllLogs();                           //Ignore all log notifications

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style = {{ flex: 1}}>
        <MainStack/>
      </SafeAreaView>
    </Provider>
  );
}

//  <MainStack>
//  <WeightGraphic ble-data=context.ble-data/>
//  <AnotherComponent ble-data=context.ble-data/>
//  </MainStack>