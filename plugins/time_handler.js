export function adjustMSecLiveLinkFormat(msec) {
  /*
    Since the range of getMilliseconds() is from 0 to 999,
    on the other hand Live Link Face is from 0 to 60,
    we have to correct them.
  */
  const normalized = msec / 1000;   // range should be from 0 to 1
  return (normalized * 60).toFixed();
}

export function getTimeCode() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const msec = now.getMilliseconds();
  const adjustedMsec = adjustMSecLiveLinkFormat(msec);

  // update time code according to Live Link Face Format
  // the format should be "hour:min:sec:milli:micro"
  return hour.toString().padStart(2, '0') + "-" + min.toString().padStart(2, '0')
    + "-" + sec.toString().padStart(2, '0') + "-" + adjustedMsec.toString().padStart(2, '0');
}

export function getDateTimeCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDay();
  const timeCode = getTimeCode();
  return year + "-" + month + "-" + day + "-" + timeCode;
}
