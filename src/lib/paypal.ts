// src/lib/paypal.ts

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET!;

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';



async function getAccessToken() {

  const auth =
    Buffer.from(
      `${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`
    ).toString('base64');


  const res = await fetch(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    {
      method:'POST',
      headers:{
        Authorization:`Basic ${auth}`,
        'Content-Type':
          'application/x-www-form-urlencoded'
      },
      body:
        'grant_type=client_credentials'
    }
  );


  const data = await res.json();


  if(!data.access_token){
    throw new Error(
      'Falha ao autenticar PayPal'
    );
  }


  return data.access_token;
}



export async function createPaypalPayout({

  email,
  amount

}:{

  email:string;
  amount:number;

}) {


  const token =
    await getAccessToken();



  const res = await fetch(
    `${PAYPAL_BASE}/v1/payments/payouts`,
    {
      method:'POST',

      headers:{
        Authorization:
          `Bearer ${token}`,

        'Content-Type':
          'application/json'
      },


      body:JSON.stringify({

        sender_batch_header:{

          sender_batch_id:
            `withdraw-${Date.now()}`,

          email_subject:
            'Você recebeu um pagamento',

        },


        items:[{

          recipient_type:'EMAIL',

          amount:{
            value:
              amount.toFixed(2),

            currency:
              'USD'
          },

          receiver:
            email,

          note:
            'Saque Roleta da Sorte'

        }]

      })

    }
  );



  const data =
    await res.json();



  if(!res.ok){

    console.error(
      'PayPal payout error',
      data
    );

    throw new Error(
      data.message ||
      'Erro PayPal'
    );

  }



  return data;

        }
