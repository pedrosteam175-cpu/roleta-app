import {
  getPaypalConfig,
  getPaypalBaseUrl
} from "@/lib/paypal-config";



// =====================================
// GERAR TOKEN PAYPAL
// =====================================

async function getAccessToken(){


  const config =
    await getPaypalConfig();



  const baseUrl =
    getPaypalBaseUrl(
      config.mode
    );



  const auth =
    Buffer
      .from(
        `${config.clientId}:${config.clientSecret}`
      )
      .toString(
        "base64"
      );



  const response =
    await fetch(
      `${baseUrl}/v1/oauth2/token`,
      {

        method:"POST",

        headers:{

          Authorization:
            `Basic ${auth}`,


          "Content-Type":
            "application/x-www-form-urlencoded"

        },


        body:
          "grant_type=client_credentials"

      }
    );



  const data =
    await response.json();



  if(!response.ok){

    throw new Error(
      data.error_description ||
      "Erro ao autenticar PayPal"
    );

  }



  return data.access_token;

}





// =====================================
// PAYPAL PAYOUT
// =====================================

interface PaypalPayoutParams {

  receiver:string;

  amount:number;

  currency?:string;

  note?:string;

}




export async function createPaypalPayout(

 params:PaypalPayoutParams

){



  const config =
    await getPaypalConfig();



  const token =
    await getAccessToken();



  const baseUrl =
    getPaypalBaseUrl(
      config.mode
    );





  const payload = {


    sender_batch_header:{

      sender_batch_id:
        `roleta-${Date.now()}`,


      email_subject:
        "Pagamento do saque Roleta da Sorte",


      email_message:
        "Seu saque foi enviado."

    },



    items:[{


      recipient_type:
        "EMAIL",


      receiver:
        params.receiver,



      amount:{

        value:
          params.amount
          .toFixed(2),


        currency:
          params.currency ||
          "USD"

      },


      note:
        params.note ||
        "Saque Roleta da Sorte"


    }]


  };





  const response =
    await fetch(

      `${baseUrl}/v1/payments/payouts`,

      {


        method:"POST",


        headers:{


          Authorization:
            `Bearer ${token}`,


          "Content-Type":
            "application/json"


        },


        body:
          JSON.stringify(
            payload
          )


      }

    );






  const data =
    await response.json();





  if(!response.ok){


    console.error(
      "PAYPAL PAYOUT ERROR:",
      data
    );



    throw new Error(

      data.message ||
      data.name ||
      "Erro ao enviar PayPal Payout"

    );


  }






  return {


    batchId:

      data.batch_header
      ?.payout_batch_id
      || null,



    status:

      data.batch_header
      ?.batch_status
      || null,



    response:
      data


  };

}
