import React  from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import Home from '../screens/Home'
import Logbook from "../screens/Logbook";
import Measurement from "../screens/Measurement";

const Stack = createNativeStackNavigator()

var a = [];

const MainStack = () => {
    return(

        <NavigationContainer>


            <Stack.Navigator
                screenOptions = {{
                   //headerShown: false, 
                }}
            >

                <Stack.Screen
                    name = 'GripMeter Lite'
                    component = { Home }
                />

                <Stack.Screen
                    name = 'Measurement'
                    component = { Measurement }
                />

                <Stack.Screen
                    name = 'Logbook'
                    component = { Logbook }
                />
                
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default MainStack