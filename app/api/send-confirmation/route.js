import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { name, email, candleUrl } = await request.json();

    if (!email || !name || !candleUrl) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Original Botanica Ancestor Altar <altar@originalbotanica.com>',
      to: [email],
      subject: `Your candle for ${name} is lit`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#0e0b08;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b08;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width:520px;background:#1a1410;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#1a1410 0%,#2a1f0e 100%);padding:40px 32px 32px;text-align:center;border-bottom:1px solid rgba(193,125,60,0.2);">
                      <p style="margin:0 0 8px;color:#c17d3c;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Original Botanica</p>
                      <h1 style="margin:0;color:#f5e6c8;font-size:26px;font-weight:400;line-height:1.3;">A candle burns for ${name}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;color:#d4c4a0;font-size:16px;line-height:1.7;">
                      <p style="margin:0 0 20px;">Your candle has been lit on the Original Botanica Ancestor Altar. The sacred flame holds space for ${name} and carries your intentions forward.</p>
                      <p style="margin:0 0 28px;">This light burns as a bridge between worlds — honoring those who came before and the love that never fades.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${candleUrl}" style="display:inline-block;background:#c17d3c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;letter-spacing:0.5px;">View Your Candle</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px 32px;border-top:1px solid rgba(193,125,60,0.15);text-align:center;">
                      <p style="margin:0;color:#7a6a50;font-size:13px;line-height:1.6;">
                        Original Botanica &middot; Family-owned since 1959 &middot; The Bronx, New York<br>
                        <a href="https://originalbotanica.com" style="color:#c17d3c;text-decoration:none;">originalbotanica.com</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, id: data.id });
  } catch (err) {
    console.error('Send confirmation error:', err);
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
