import React, { Component } from "react";
import { Device } from 'react-native-ble-plx';

// import { Provider, useDispatch, useSelector, connect as reduxConnect } from 'react-redux';

import { connect } from 'react-redux';

import {
    type ReduxState,
    clearLogs,
    disconnect,
    executeTest,
    forgetSensorTag,
    ConnectionState,
    sendConfigDevice,
  } from '../components/Reducer';  


import { AreaChart, Grid } from 'react-native-svg-charts'
import * as shape from 'd3-shape'

import {
   Button,
   Image,
   Text,
   TouchableOpacity,
   View
  } from "react-native";

import {styles} from '../Styles/styles';

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

let data = [0];  // No idea how to do a class member?!

class Logbook extends Component {
    nombre: String;
    props: Props;

    // const { nombre } = props.route.params

    //const data = [0]
    constructor(props) {
        super(props);

        this.nombre = props.route.params.nombre;
        this.props = props;

        //console.log(props)
    
        this.state = {
          showModal: false,
        };
      };

    static getDerivedStateFromProps(props, state) {
        // Add new data to chart!
        data = [...data, parseFloat(props.scaleValue)];
        return state;
    }

    render() {
        return (
            <View>
                <Text style={styles.titleText}>{ data.slice(-1) } kg</Text>
                <AreaChart
                    style={{ height: 400 }}
                    data={data}
                    contentInset={{ top: 30, bottom: 30 }}
                    curve={shape.curveNatural}
                    svg={{ fill: 'rgba(134, 65, 244, 0.8)' }}
                >
                    <Grid />
                </AreaChart>

                <View style={styles.rowView}>
                    <Text style={styles.versionText}>This is Logbook screen!</Text>
                    <Text style={styles.versionText}>Nombre enviado: { this.nombre } </Text>
                </View>
                <Button
                    style={{ flex: 1 }}
                    onPress={() => {
                    console.log('TAP: SEND Config device');
                    this.props.sendConfigDevice('{"ID":"cmd","data":"double_buzz"}');

                    }}
                    title={'SendConfig'}
                />
            </View>
        )
    }
}


const mapStateToProps = state => {
    return{
        scaleValue: state.scaleValue,
        bleDevice: state.activeSensorTag
    }
}

const mapDispatchToProps = dispatch => {
    return{
        sendConfigDevice: (s: String) => dispatch(sendConfigDevice(s))
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Logbook)




//export default Logbook

