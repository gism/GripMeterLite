import React from "react";
import {
   Button,
   Image,
   Text,
   TouchableOpacity,
   View
  } from "react-native";

import {styles} from '../Styles/styles';

const Home = (props) => {

    const { connectFunction, disconnectFunction, isConnected, deviceValue, deviceBattery, buzzFunction } = props

    return (
        <View>
          <Image
            style={{
              alignSelf: 'center',
              height: 200,
              width: 400,
              borderWidth: 1,
              borderRadius: 75
            }}
            source={require('../assets/GripMeter_Lite.png')}
            resizeMode="contain"
          />

        <View style={styles.rowView}>
          <Text style={styles.versionText}>Version: UTRA_BETA_0.0</Text>
        </View>

        <View style={{paddingBottom: 200}}></View>


        {/* Connect Button */}
        <View style={styles.rowView}>
          <TouchableOpacity style={{width: 120}}>
            {!isConnected ? (
              <Button
                title="Connect"
                onPress={ connectFunction }
                disabled={false}
              />
            ) : (
              <Button
                title="Disonnect"
                onPress={ disconnectFunction }
                disabled={false}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={{paddingBottom: 20}}></View>

        {/* Measure Button */}
        <View style={styles.rowView}>
          <TouchableOpacity style={{width: 120}}>
              <Button
                title="Measure"
                onPress={() => {
                  alert("Hola Measure()");
                }}
                disabled={false}
              />
          </TouchableOpacity>
        </View>


        {!isConnected ? (
          
          <View style={styles.rowView}>
            <Text style={styles.versionText}>Not connected yet</Text>
          </View>

        ) : (
          <View style={{paddingBottom: 20}}>

            <View style={styles.rowView}>
              <Text style={styles.versionText}>Connected</Text>
            </View>

            {/* Monitored Value */}
            <View style={styles.rowView}>
              <Text style={styles.baseText}>{deviceValue}</Text>
            </View>
            <View style={styles.rowView}>
              <Text style={styles.baseText}>{deviceBattery}</Text>
            </View>
        
        <View style={{paddingBottom: 20}}></View>

        {/* Buzzer Button */}
        <View style={styles.rowView}>
          <TouchableOpacity style={{width: 120}}>
            <Button
                title="Buzz"
                onPress={ buzzFunction }
                disabled={false}
              />
          </TouchableOpacity>
        </View>

          </View>

        )}



        </View>
    )
}

export default Home