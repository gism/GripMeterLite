// GripMeter UUID:
const SERVICE_UUID_GRIPMETER = '7e4e1701-1ea6-40c9-9dcc-13d34ffead57';
const UUID_SCALE = '7e4e1703-1ea6-40c9-9dcc-13d34ffead57';
const UUID_CONFIG = '7e4e1702-1ea6-40c9-9dcc-13d34ffead57';
const UUID_BAT = '7e4e1704-1ea6-40c9-9dcc-13d34ffead57';

const SHORT_BUZZ = '{"ID":"cmd","data":"short_buzz"}'
const LONG_BUZZ = '{"ID":"cmd","data":"long_buzz"}'
const DOUBLE_BUZZ = '{"ID":"cmd","data":"double_buzz"}'
const DISPLAY_SMILE = '{"ID":"cmd","data":"disp_smile"}'

// {\"ID\":\"scale_factor\",\"data\":\"" + deviceFactorView.getText() + "\"}
// "{\"ID\":\"tare\",\"data\":\"" + currentScaleValue.toString() + "\"}";