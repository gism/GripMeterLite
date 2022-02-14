import React, {useState} from 'react';
import {
  TouchableOpacity,
  Button,
  PermissionsAndroid,
  View,
  Text,
  Image,
} from 'react-native';

import MainStack from './navigation/MainStack';


// TODO: 
// Insert chart
// https://githubhelp.com/JesperLekland/react-native-svg-charts
// Example:
// https://github.com/catarizea/bvm-ventilator-covid/tree/blog-post-ble-client

import {LogBox} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

LogBox.ignoreLogs(['new NativeEventEmitter']);    // Ignore log notification by message
LogBox.ignoreAllLogs();                           //Ignore all log notifications

export default function App() {
  return (
    <SafeAreaView style = {{ flex: 1}}>
      <MainStack/>
    </SafeAreaView>    
  );
}
