import paypal from '@paypal/checkout-server-sdk';


function getPayPalEnvironment(){

  const clientId = process.env.PAYPAL_CLIENT_ID;

  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;


  if(!clientId || !clientSecret){

    throw new Error(
      'PayPal não configurado'
    );

  }



  if(process.env.PAYPAL_MODE === 'live'){

    return new paypal.core.LiveEnvironment(
      clientId,
      clientSecret
    );

  }



  return new paypal.core.SandboxEnvironment(
    clientId,
    clientSecret
  );


}



function getClient(){

  const environment =
    getPayPalEnvironment();


  return new paypal.core.PayPalHttpClient(
    environment
  );

}




interface PayPalPayoutProps {

  email:string;

  amount:number;

  note?:string;

}



export async function createPayPalPayout({

  email,

  amount,

  note='Pagamento'

}:PayPalPayoutProps){


  const client =
    getClient();



  const request:any =
    new paypal.core.PayPalHttpRequest(
      '/v1/payments/payouts',
      'POST'
    );



  request.requestBody = {


    sender_batch_header:{

      sender_batch_id:
        `roleta_${Date.now()}`,

      email_subject:
        'Você recebeu um pagamento',

      email_message:
        note

    },


    items:[

      {

        recipient_type:'EMAIL',

        amount:{

          value:
            amount.toFixed(2),

          currency:'USD'

        },


        receiver:
          email,


        note

      }

    ]


  };



  const response =
    await client.execute(request);



  return {

    batchId:
      response.result
      .batch_header
      .payout_batch_id,


    status:
      response.result
      .batch_header
      .batch_status

  };


}
