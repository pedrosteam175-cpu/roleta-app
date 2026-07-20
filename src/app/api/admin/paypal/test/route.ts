import {
  NextResponse
} from "next/server";


import {
  getPaypalConfig,
  getPaypalBaseUrl
} from "@/lib/paypal-config";



// =================================
// TESTAR CONEXÃO PAYPAL
// =================================

export async function POST(){


  try{


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


      return NextResponse.json(

        {

          success:false,

          error:
            data.error_description ||
            "Falha na autenticação PayPal"

        },

        {
          status:400
        }

      );


    }




    return NextResponse.json({

      success:true,

      message:
        "Conexão PayPal funcionando",

      mode:
        config.mode

    });



  }catch(error){



    console.error(
      error
    );



    return NextResponse.json(

      {

        success:false,

        error:
          "PayPal não configurado"

      },

      {
        status:500
      }

    );


  }


}
