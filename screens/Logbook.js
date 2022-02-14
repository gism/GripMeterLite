import React from "react";

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

const Logbook = ( {navigation, route} ) => {

  const { nombre } = route.params

  const data = [50, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80]


    return (
        <View>

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
            <Text style={styles.versionText}>Nombre enviado: { nombre } </Text>
          </View>
        </View>
    )
}

export default Logbook