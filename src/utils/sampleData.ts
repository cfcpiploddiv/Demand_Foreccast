/**
 * Generates realistic electricity demand time-series data for testing and immediate demo,
 * matching the exact structure from the reference python pipeline:
 * timestamp, load_MW, Weather Condition, Holiday Type, Festival Name, Temp, Humidity
 */

export function generateRealisticPowerDataset(numDays = 120): string {
  const headers = ['timestamp', 'load_MW', 'Weather Condition', 'Holiday Type', 'Festival Name', 'Temp', 'Humidity'];
  const rows: string[] = [headers.join(',')];

  const startDate = new Date(2023, 3, 1, 0, 0, 0); // April 1, 2023
  const weatherConditions = ['Clear', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Hazy'];
  const festivals: { [dateStr: string]: string } = {
    '14-04-2023': 'Baisakhi',
    '22-04-2023': 'Eid-ul-Fitr',
    '15-08-2023': 'Independence Day',
    '30-08-2023': 'Raksha Bandhan',
    '07-09-2023': 'Janmashtami',
    '19-09-2023': 'Ganesh Chaturthi',
    '02-10-2023': 'Gandhi Jayanti',
    '24-10-2023': 'Dussehra',
    '12-11-2023': 'Diwali',
    '25-12-2023': 'Christmas',
  };

  const totalHours = numDays * 24;

  let currentMW = 2240;

  for (let h = 0; h < totalHours; h++) {
    const curDate = new Date(startDate.getTime() + h * 3600 * 1000);
    const day = String(curDate.getDate()).padStart(2, '0');
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const year = curDate.getFullYear();
    const hour = String(curDate.getHours()).padStart(2, '0');
    const minute = '00';
    const dateKey = `${day}-${month}-${year}`;
    const timestampStr = `${dateKey} ${hour}:${minute}`;

    const hourNum = curDate.getHours();
    const dayOfWeek = curDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Diurnal load curve: lowest at 4-5 AM (~1600 MW), rises in morning (9-11 AM ~ 2600 MW),
    // afternoon plateau, evening peak (7-9 PM ~ 3100 MW), tapering at night.
    const diurnalFactor =
      hourNum < 6
        ? 0.72 + (hourNum / 6) * 0.1
        : hourNum < 12
        ? 0.85 + ((hourNum - 6) / 6) * 0.28
        : hourNum < 18
        ? 1.05 + Math.sin(((hourNum - 12) / 6) * Math.PI) * 0.08
        : hourNum < 22
        ? 1.22 - ((hourNum - 18) / 4) * 0.08
        : 1.0 - ((hourNum - 22) / 2) * 0.18;

    // Day of week factor: weekends have lower industrial/commercial demand
    const weekdayFactor = isWeekend ? 0.88 : 1.04;

    // Temperature simulation: warmer in afternoon, cooler in night/early morning
    const baseTemp = 28 + Math.sin((h / (24 * 30)) * Math.PI) * 6; // monthly shift
    const dailyTempSwing = Math.sin(((hourNum - 9) / 24) * 2 * Math.PI) * 5.5;
    const temp = Math.max(16, Math.min(45, +(baseTemp + dailyTempSwing + (Math.random() - 0.5) * 1.5).toFixed(1)));

    // Temperature cooling load effect (AC load kicks in strongly above 30°C)
    const coolingEffect = temp > 30 ? (temp - 30) * 28 : 0;

    // Humidity simulation (inversely correlated with temp)
    const humidity = Math.max(20, Math.min(95, +(60 - dailyTempSwing * 2 + (Math.random() - 0.5) * 5).toFixed(1)));

    // Weather condition
    let weather = weatherConditions[0];
    if (humidity > 78) weather = 'Rainy';
    else if (humidity > 62) weather = 'Cloudy';
    else if (humidity > 45) weather = 'Partly Cloudy';
    else if (temp > 38) weather = 'Hazy';

    // Holiday Type & Festival
    let holidayType = isWeekend ? 'Weekend' : 'Working Day';
    let festivalName = festivals[dateKey] || '';
    if (festivalName) {
      holidayType = 'National Holiday';
    }

    // Base calculation with AR(1) smoothness
    const targetLoad = 2200 * diurnalFactor * weekdayFactor + coolingEffect + (festivalName ? 150 : 0);
    // Smooth transition
    currentMW = +(currentMW * 0.75 + targetLoad * 0.25 + (Math.random() - 0.5) * 40).toFixed(2);
    // Ensure bounds
    currentMW = Math.max(1200, Math.min(4200, currentMW));

    // Intentionally inject tiny realistic missing values (< 0.2%) to trigger EDA data quality detection
    const loadValue = h % 380 === 0 ? '' : currentMW.toString();
    const tempValue = h % 500 === 0 ? '' : temp.toString();
    const humidityValue = h % 600 === 0 ? '' : humidity.toString();

    rows.push([
      timestampStr,
      loadValue,
      weather,
      holidayType,
      festivalName,
      tempValue,
      humidityValue
    ].join(','));
  }

  return rows.join('\n');
}

export const SAMPLE_DATASET_CSV = generateRealisticPowerDataset(90); // 90 days = 2160 hourly records for fast & rich analysis
