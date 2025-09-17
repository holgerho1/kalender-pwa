export default async function handler(req, res) {
  const { CLIENT_ID, REDIRECT_URI } = process.env;
  const scope = 'https://www.googleapis.com/auth/calendar.readonly';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}&access_type=offline&prompt=consent`;
  res.redirect(url);
}