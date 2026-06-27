// Helper to format dates consistently (YYYY-MM-DD)
export const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// Helper to add days to a date string
export const addDays = (dateStr, days) => {
  const result = new Date(dateStr);
  result.setDate(result.getDate() + days);
  return formatDate(result);
};
