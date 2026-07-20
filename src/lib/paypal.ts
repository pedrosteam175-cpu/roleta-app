import {
  getPaypalConfig,
  getPaypalBaseUrl
} from "@/lib/paypal-config";



// =================================
// GERAR TOKEN OAUTH PAYPAL
// =================================

async function getPaypalAccessToken(){


  const config =
    await getPaypalConfig();



  const baseUrl =
    getPaypalBaseUrl(
      config.mode
    );



  const credentials =
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
            `Basic ${credentials}`,


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




// =================================
// CRIAR PAYPAL PAYOUT
// =================================

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
    await getPaypalAccessToken();



  const baseUrl =
    getPaypalBaseUrl(
      config.mode
    );



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
          JSON.stringify({

            sender_batch_header:{


              sender_batch_id:
                `ROULETTA-${Date.now()}`,


              email_subject:
                "Você recebeu um pagamento",


              email_message:
                "Seu saque foi enviado com sucesso."

            },


            items:[

              {


                recipient_type:
                  "EMAIL",


                amount:{


                  value:
                    params.amount
                    .toFixed(2),


                  currency:
                    params.currency ||
                    "USD"

                },


                receiver:
                  params.receiver,


                note:
                  params.note ||
                  "Saque RoletaApp"

              }

            ]

          })


      }

    );



  const data =
    await response.json();



  if(!response.ok){


    console.error(
      "PAYPAL ERROR",
      data
    );


    throw new Error(
      data.message ||
      "Erro ao criar payout PayPal"
    );


  }



  return {


    batchId:
      data.batch_header
      ?.payout_batch_id,


    status:
      data.batch_header
      ?.batch_status,


    raw:
      data

  };


    }
