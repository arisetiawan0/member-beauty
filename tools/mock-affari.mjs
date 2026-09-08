import { createServer } from 'node:http';

// Stand-in for api.affariretail.id/beauty/ — shapes taken from the PRD.
const MEMBER = {
  Kode: 'MBR-77120',
  Nama: 'Siti Rahmawati',
  NoKartu: 'BK000077120',
  NoHP: '085241110099',
  JMember: 'gold',
  PointAkhir: '3.150',
  TglBerakhir: '2027-03-31',
  TglDaftar: '2023-06-11',
  TglLahir: '1900/01/01',
  IsSuccess: true,
};

const HISTORY = [
  { NoTransaksi: 'K-2026-9001', Tanggal: '05/09/2026', Keterangan: 'Belanja di Beauty Kendari', Outlet: 'Kendari Kota', Nominal: '412.500', Point: 412 },
  { NoTransaksi: 'K-2026-8877', Tanggal: '2026-08-30T00:00:00', Keterangan: 'Penukaran poin', Outlet: 'Kendari Kota', Nominal: 0, Point: -750 },
  { NoTransaksi: 'K-2026-8410', Tanggal: '/Date(1755993600000)/', Keterangan: '', Outlet: 'Kendari Kota', Nominal: 268000, Point: 268 },
];

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const token = req.headers.affari_token;
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };

  if (token !== 'test-token') return send(401, { IsSuccess: false, Message: 'invalid token' });

  if (url.pathname === '/api/member') {
    const field = url.searchParams.get('field');
    const value = url.searchParams.get('value');
    if (value === 'BOOM') return send(500, { IsSuccess: false, Message: 'upstream down' });
    if (value === 'SOFTFAIL') return send(200, { IsSuccess: false, Message: 'query rejected' });
    const hit = (field === 'kode' && (value === MEMBER.Kode || value === MEMBER.NoKartu))
             || (field === 'nohp' && value === MEMBER.NoHP);
    return send(200, hit ? MEMBER : {});           // `{}` = no match, per PRD §5.1
  }

  if (url.pathname === '/api/listhistoripoint') {
    if (url.searchParams.get('kode') === 'EMPTY') return send(200, []);
    return send(200, HISTORY);
  }

  send(404, { IsSuccess: false, Message: 'unknown endpoint' });
}).listen(3999, () => console.log('mock affari on 3999'));
