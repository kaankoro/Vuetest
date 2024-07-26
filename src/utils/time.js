export default function toSeconds(timeString) {
    const [hoursStr, minutesStr, secondsStr] = timeString.split(":");
    const [secondsPart, millisecondsStr] = secondsStr.split(".");
  
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsPart, 10);
    const milliseconds = parseInt(millisecondsStr, 10);
  
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }
  