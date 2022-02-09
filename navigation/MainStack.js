import React  from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

const Stack = createNativeStackNavigator()

const MainStack = () => {
    return(
        <NavigationContainer>
            <Stack.Navigator>

                <Stack.Screen
                    name = 'Home'
                    component = { Home }
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