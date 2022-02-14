import base64 from 'react-native-base64';
import {BleManager, Device} from 'react-native-ble-plx';




export default class DeviceHandler {

// GripMeter UUID:
static SERVICE_UUID_GRIPMETER = '7e4e1701-1ea6-40c9-9dcc-13d34ffead57';
static UUID_SCALE = '7e4e1703-1ea6-40c9-9dcc-13d34ffead57';
static UUID_CONFIG = '7e4e1702-1ea6-40c9-9dcc-13d34ffead57';
static UUID_BAT = '7e4e1704-1ea6-40c9-9dcc-13d34ffead57';

static SHORT_BUZZ = '{"ID":"cmd","data":"short_buzz"}'
static LONG_BUZZ = '{"ID":"cmd","data":"long_buzz"}'
static DOUBLE_BUZZ = '{"ID":"cmd","data":"double_buzz"}'
static DISPLAY_SMILE = '{"ID":"cmd","data":"disp_smile"}'

// {\"ID\":\"scale_factor\",\"data\":\"" + deviceFactorView.getText() + "\"}
// "{\"ID\":\"tare\",\"data\":\"" + currentScaleValue.toString() + "\"}";


    constructor() {
        //...
    }
  }