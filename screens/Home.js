import React, {useState, Component} from 'react';
import { Provider, useDispatch, useSelector, connect as reduxConnect } from 'react-redux';
import {RootState, store} from '../components/Store';
import base64 from 'react-native-base64';
import { Device } from 'react-native-ble-plx';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import {
  Button
} from '../components/CustomComponents';
import {
    type ReduxState,
    clearLogs,
    connect,
    disconnect,
    executeTest,
    forgetSensorTag,
    ConnectionState,
  } from '../components/Reducer';
import { SensorTagTests, type SensorTagTestMetadata } from './Tests';
import {styles, COLORS} from '../Styles/styles';
//import {BleDeviceHandler} from '../components/BleDeviceHandler';

type Props = {
  sensorTag: ?Device,
  connectionState: $Keys<typeof ConnectionState>,
  logs: Array<string>,
  clearLogs: typeof clearLogs,
  connect: typeof connect,
  disconnect: typeof disconnect,
  executeTest: typeof executeTest,
  currentTest: ?string,
  forgetSensorTag: typeof forgetSensorTag,
  scaleValue : Number,
  navigation: navigation,
};

type State = {
  showModal: boolean,
  devTabs: Number,
  showDevInfo: boolean,
};

class Home extends Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      showModal: false,
      devTabs: 0,
    };
  };

  sensorDeviceStatus(): string {
    switch (this.props.connectionState) {
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.DISCOVERING:
        return 'Discovering...';
      case ConnectionState.CONNECTED:
        //this.subscribeScaleChar(this.props.sensorTag);
        //this.deviceHandler.setDevice(this.props.sensorTag);

        return 'Connected';
      case ConnectionState.DISCONNECTED:
      case ConnectionState.DISCONNECTING:
        if (this.props.sensorTag) {
          return 'Device found: ' + this.props.sensorTag.id;
        }
    }
    return 'Searching GripMeter...';
  }

  isSensorDeviceReadyToConnect(): boolean {
    return (
      this.props.sensorTag != null &&
      this.props.connectionState === ConnectionState.DISCONNECTED
    );
  }

  isSensorDeviceReadyToDisconnect(): boolean {
    return this.props.connectionState === ConnectionState.CONNECTED;
  }

  isSensorDeviceReadyToExecute(): boolean {
    return (
      this.props.connectionState === ConnectionState.CONNECTED &&
      this.props.currentTest == null
    );
  }

  renderHeader() {
    return (
      <View style={{ padding: 10 }}>
        <TouchableOpacity activeOpacity = { .9 } onPress={() => {
              this.setState({ devTabs: this.state.devTabs + 1 });
              console.log("DevTabs: " + this.state.devTabs);
              if(this.state.devTabs > 20){
                this.state.showDevInfo = true;
              }
            }}>
          <Image
            style={{
              alignSelf: 'center',
              height: 200,
              width: 400,
              borderWidth: 0,
              borderRadius: 0
            }}
            source={require('../assets/GripMeter_Lite.png')}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.textStyle, {alignSelf: 'center'}} numberOfLines={1}>
          {this.sensorDeviceStatus()}
        </Text>
        
        <View style={{paddingBottom: 20}}></View>
        
        <View style={{ flexDirection: 'row', paddingTop: 5 }}>
          {!this.isSensorDeviceReadyToDisconnect() ? (
            <Button
            disabled={!this.isSensorDeviceReadyToConnect()}
            style={{ flex: 1 }}
            onPress={() => {
              if (this.props.sensorTag != null) {
                this.props.connect(this.props.sensorTag);
              }
            }}
            title={'CONNECT'}
            />  
          ) : (
            <Button
            disabled={!this.isSensorDeviceReadyToDisconnect()}
            style={{ flex: 1 }}
            onPress={() => {
              this.props.disconnect();
            }}
            title={'DISCONNECT'}
            />
          )}
        </View>

        <View style={{ flexDirection: 'row', paddingTop: 5 }}>
          <Button
            disabled={!this.isSensorDeviceReadyToExecute()}
            style={{ flex: 1 }}
            onPress={() => {
              alert('hola: do measurement');
            }}
            title={'DO MEASUREMENT'}
          />
        </View>

        {/* Logbook Button */}
        <View style={{ flexDirection: 'row', paddingTop: 15 }}>
          <Button
            // disabled={!this.isSensorDeviceReadyToExecute()}
            style={{ flex: 1 }}
            onPress={() => {
              console.log('GripMeter Info: TAP logbook');
              this.props.navigation.navigate('Logbook', {
                nombre: 'Julay'
              })
            }}
            title={'LOGBOOK'}
          />
        </View>

      </View>
    );
  }

  renderLogs() {
    return (
      <View style={{ flex: 1, padding: 10, paddingTop: 0 }}>
        <FlatList
          style={{ flex: 1 }}
          data={this.props.logs}
          renderItem={({ item }) => (
            <Text style={styles.logTextStyle}> {item} </Text>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        <Button
          style={{ paddingTop: 10 }}
          onPress={() => {
            this.props.clearLogs();
          }}
          title={'Clear logs'}
        />

        <View style={{ flexDirection: 'row', paddingTop: 5 }}>
          <Button
            disabled={!this.isSensorDeviceReadyToExecute()}
            style={{ flex: 1 }}
            onPress={() => {
              alert('hola: do measurement');
              this.props.executeTest(item.id);
            }}
            title={'GET SCALE VALUES! :)'}
          />
          </View>

          <View style={{ flexDirection: 'row', paddingTop: 5 }}>
          <Button
            disabled={!this.isSensorDeviceReadyToExecute()}
            style={{ flex: 1 }}
            onPress={() => {
              this.setState({ showModal: true });
            }}
            title={'Execute test'}
          />
          <View style={{ width: 5 }} />
          <Button
            style={{ flex: 1 }}
            disabled={this.props.sensorTag == null}
            onPress={() => {
              this.props.forgetSensorTag();
            }}
            title={'Forget'}
          />
        </View>
      </View>

    );
  }

  renderModal() {
    // $FlowFixMe: SensorTagTests are keeping SensorTagTestMetadata as values.
    const tests: Array<SensorTagTestMetadata> = Object.values(SensorTagTests);

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.state.showModal}
        onRequestClose={() => { }}>
        <View
          style={{
            backgroundColor: '#00000060',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#2a24fb',
              borderRadius: 10,
              height: '50%',
              padding: 5,
              shadowColor: 'black',
              shadowRadius: 20,
              shadowOpacity: 0.9,
              elevation: 20,
            }}>
            <Text
              style={[
                styles.textStyle,
                { paddingBottom: 10, alignSelf: 'center' },
              ]}>
              Select test to execute:
            </Text>
            <FlatList
              data={tests}
              renderItem={({ item }) => (
                <Button
                  style={{ paddingBottom: 5 }}
                  disabled={!this.isSensorDeviceReadyToExecute()}
                  onPress={() => {
                    this.props.executeTest(item.id);
                    this.setState({ showModal: false });
                  }}
                  title={item.title}
                />
              )}
              keyExtractor={(item, index) => index.toString()}
            />
            <Button
              style={{ paddingTop: 5 }}
              onPress={() => {
                this.setState({ showModal: false });
              }}
              title={'Cancel'}
            />
          </View>
        </View>
      </Modal>
    );
  }

  render() {
    let logs;
    if(this.state.showDevInfo) {
      logs = this.renderLogs();
    }
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        {this.renderHeader()}
        {logs}
        {this.renderModal()}
      </SafeAreaView>
    );
  }
}

export default reduxConnect(
  (state: ReduxState): $Shape<Props> => ({
    logs: state.logs,
    sensorTag: state.activeSensorTag,
    connectionState: state.connectionState,
    currentTest: state.currentTest,
    scaleValue :state.scaleValue,
  }),
  {
    clearLogs,
    connect,
    disconnect,
    forgetSensorTag,
    executeTest,
  },
)(Home);
