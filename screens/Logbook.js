import React from "react";
import {
   Button,
   Image,
   Text,
   TouchableOpacity,
   View
  } from "react-native";

import {styles} from '../Styles/styles';

const Logbook = () => {

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
            <Text style={styles.versionText}>This is Logbook screen</Text>
            </View>
        </View>
    )
}

export default Logbook