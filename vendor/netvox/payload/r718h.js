function getCfgCmd(cfgcmd){
  var cfgcmdlist = {
    1:   "ConfigReportReq",
    129: "ConfigReportRsp",
    2:   "ReadConfigReportReq",
    130: "ReadConfigReportRsp",
    3:	 "SetFiltertimeReq",
    131: "SetFiltertimeRsp",
    4:	 "GetFiltertimeReq",
    132: "GetFiltertimeRsp",
    5:	 "SetPulseCounterClearModeReq",
    133: "SetPulseCounterClearModeRsp",
    6:	 "GetPulseCounterClearModeReq",
    134: "GetPulseCounterClearModeRsp",
  };
  return cfgcmdlist[cfgcmd];
}

function getCmdToID(cmdtype){
  if (cmdtype == "ConfigReportReq")
	  return 1;
  else if (cmdtype == "ConfigReportRsp")
	  return 129;
  else if (cmdtype == "ReadConfigReportReq")
	  return 2;
  else if (cmdtype == "ReadConfigReportRsp")
	  return 130;
  else if (cmdtype == "SetFiltertimeReq")
	  return 3;
  else if (cmdtype == "SetFiltertimeRsp")
	  return 131;
  else if (cmdtype == "GetFiltertimeReq")
	  return 4;
  else if (cmdtype == "GetFiltertimeRsp")
	  return 132;
  else if (cmdtype == "SetPulseCounterClearModeReq")
	  return 5;
  else if (cmdtype == "SetPulseCounterClearModeRsp")
	  return 133;
  else if (cmdtype == "GetPulseCounterClearModeReq")
	  return 6;
  else if (cmdtype == "GetPulseCounterClearModeRsp")
	  return 134;
}

function getDeviceName(dev){
  var deviceName = {
	31: "R718H",
	63: "R718H2"
  };
  return deviceName[dev];
}

function getDeviceID(devName){
  var deviceName = {
  	"R718H": 31,
  	"R718H2": 63
  };

  return deviceName[devName];
}

function padLeft(str, len) {
    str = '' + str;
    if (str.length >= len) {
        return str;
    } else {
        return padLeft("0" + str, len);
    }
}

function decodeUplink(input) {
  var data = {};
  switch (input.fPort) {
    case 6:
		if (input.bytes[2] === 0x00)
		{
			data.Device = getDeviceName(input.bytes[1]);
			data.SWver =  input.bytes[3]/10;
			data.HWver =  input.bytes[4];
			data.Datecode = padLeft(input.bytes[5].toString(16), 2) + padLeft(input.bytes[6].toString(16), 2) + padLeft(input.bytes[7].toString(16), 2) + padLeft(input.bytes[8].toString(16), 2);
			
			return {
				data: data,
			};
		}
		
		data.Device = getDeviceName(input.bytes[1]);
		data.Volt = input.bytes[3]/10;
		if (data.Device === "R718H")
			data.PulseCount = (input.bytes[4]<<8 | input.bytes[5]);
		else if (data.Device === "R718H2")
		{
			data.PulseCount1 = (input.bytes[4]<<8 | input.bytes[5]);
			data.PulseCount2 = (input.bytes[6]<<8 | input.bytes[7]);
		}
		break;
		
	case 7:
		data.Cmd = getCfgCmd(input.bytes[0]);
		data.Device = getDeviceName(input.bytes[1]);
		if (input.bytes[0] === getCmdToID("ConfigReportRsp"))
		{
			data.Status = (input.bytes[2] === 0x00) ? 'Success' : 'Failure';
		}
		else if (input.bytes[0] === getCmdToID("ReadConfigReportRsp"))
		{
			data.MinTime = (input.bytes[2]<<8 | input.bytes[3]);
			data.MaxTime = (input.bytes[4]<<8 | input.bytes[5]);
			data.BatteryChange = input.bytes[6]/10;
		}
		else if (input.bytes[0] === getCmdToID("SetFiltertimeRsp"))
		{
			data.Status = (input.bytes[2] === 0x00) ? 'Success' : 'Failure';
		}
		else if (input.bytes[0] === getCmdToID("GetFiltertimeRsp"))
		{
			data.FilterTime = input.bytes[2] * 5;
		}
		else if (input.bytes[0] === getCmdToID("SetPulseCounterClearModeRsp"))
		{
			data.Status = (input.bytes[2] === 0x00) ? 'Success' : 'Failure';
		}
		else if (input.bytes[0] === getCmdToID("GetPulseCounterClearModeRsp"))
		{
			data.PulseCounterClearMode = (input.bytes[2] === 0x00) ? 'Clear when send' : 'Clear when Roll-Over';
		}
		
		break;	

	default:
      return {
        errors: ['unknown FPort'],
      };
	  
    }
          
	 return {
		data: data,
	};
 }
  
function encodeDownlink(input) {
  var ret = [];
  var devid;
  var getCmdID;
	  
  getCmdID = getCmdToID(input.data.Cmd);
  devid = getDeviceID(input.data.Device);

  if (input.data.Cmd == "ConfigReportReq")
  {
	  var mint = input.data.MinTime;
	  var maxt = input.data.MaxTime;
	  var batteryChg = input.data.BatteryChange * 10;
	  
	  ret = ret.concat(getCmdID, devid, (mint >> 8), (mint & 0xFF), (maxt >> 8), (maxt & 0xFF), batteryChg, 0x00, 0x00, 0x00, 0x00);
  }
  else if (input.data.Cmd == "ReadConfigReportReq")
  {
	  ret = ret.concat(getCmdID, devid, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
  }
  else if (input.data.Cmd == "SetFiltertimeReq")
  {
  	  var filtert = input.data.FilterTime / 5;
	  ret = ret.concat(getCmdID, devid, filtert, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
  }
  else if (input.data.Cmd == "GetFiltertimeReq")
  {
	  ret = ret.concat(getCmdID, devid, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
  }
  else if (input.data.Cmd == "SetPulseCounterClearModeReq")
  {
  	  var mode = input.data.PulseCounterClearMode;
	  ret = ret.concat(getCmdID, devid, mode, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
  }
  else if (input.data.Cmd == "GetPulseCounterClearModeReq")
  {
	  ret = ret.concat(getCmdID, devid, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
  }
  
  return {
    fPort: 7,
    bytes: ret
  };
}  
  
function decodeDownlink(input) {
  var data = {};
  switch (input.fPort) {
    case 7:
		data.Cmd = getCfgCmd(input.bytes[0]);
		data.Device = getDeviceName(input.bytes[1]);
		if (input.bytes[0] === getCmdToID("ConfigReportReq"))
		{
			data.MinTime = (input.bytes[2]<<8 | input.bytes[3]);
			data.MaxTime = (input.bytes[4]<<8 | input.bytes[5]);
			data.BatteryChange = input.bytes[6]/10;
		}
		else if (input.bytes[0] === getCmdToID("SetFiltertimeReq"))
		{
			data.FilterTime = input.bytes[2] * 5;
		}
		else if (input.bytes[0] === getCmdToID("SetPulseCounterClearModeReq"))
		{
			data.PulseCounterClearMode = input.bytes[2];
		}
		break;
		
    default:
      return {
        errors: ['invalid FPort'],
      };
  }
  
  return {
		data: data,
	};
}
