import {StyleSheet} from 'react-native';

export const COLORS = {
  white: '#fff',
  black: '#000',
  darktext: '#212529',
  cleartext: '#f8f9fa',
  primarycolor: '#ffc300',
  primarybackground: '#F2F2F1',
  disable: '#2E5B94',
  enable: '#0077b6',

  buttonColorActive: '#7735C2',
  buttonColorDisable: '#a48cbf',
}

export const styles = StyleSheet.create({
  baseText: {
    fontSize: 15,
    fontFamily: 'Cochin',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 10,
    fontWeight: 'normal',
    textAlign: 'right'
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.primarybackground,
    padding: 5,
  },
  textStyle: {
    color: COLORS.darktext,
    fontSize: 20,
  },
  logTextStyle: {
    color: COLORS.darktext,
    fontSize: 9,
  },
  buttonStyle: {
    borderWidth: 0,
    borderRadius: 10,
    padding: 10,
    backgroundColor: COLORS.buttonColorActive,
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  disabledButtonStyle: {
    backgroundColor: COLORS.buttonColorDisable,
    color: COLORS.white,
  },
});


