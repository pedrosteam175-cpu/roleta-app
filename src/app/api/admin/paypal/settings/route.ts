import {
  NextRequest,
  NextResponse
} from "next/server";


import { db } from "@/db";


import {
  paypalSettings
} from "@/db/schema";


import {
  encrypt
} from "@/lib/crypto";


import {
  desc
} from "drizzle-orm";



// =================================
// BUSCAR CONFIG PAYPAL
// =================================

export async function GET(){


  try{


    const config =
      await db
        .select({
          id:
            paypalSettings.id,

          clientId:
            paypalSettings.clientId,

          mode:
            paypalSettings.mode,

          senderEmail:
            paypalSettings.senderEmail

        })

        .from(
          paypalSettings
        )

        .orderBy(
          desc(
            paypalSettings.createdAt
          )
        )

        .limit(1);



    if(!config.length){

      return NextResponse.json(
        null
      );

    }



    return NextResponse.json(
      config[0]
    );



  }catch(error){


    return NextResponse.json(

      {
        error:
          "Erro ao buscar configuração"
      },

      {
        status:500
      }

    );

  }


}




// =================================
// SALVAR CONFIG PAYPAL
// =================================

export async function POST(
  req:NextRequest
){


  try{


    const body =
      await req.json();



    if(
      !body.clientId ||
      !body.clientSecret
    ){

      return NextResponse.json(

        {
          error:
            "Client ID e Secret obrigatórios"
        },

        {
          status:400
        }

      );

    }



    await db
      .insert(
        paypalSettings
      )
      .values({

        clientId:
          body.clientId,


        clientSecret:
          encrypt(
            body.clientSecret
          ),


        mode:
          body.mode ||
          "sandbox",


        senderEmail:
          body.senderEmail ||
          null

      });



    return NextResponse.json({

      success:true,

      message:
        "PayPal configurado com sucesso"

    });



  }catch(error){


    console.error(
      error
    );



    return NextResponse.json(

      {
        error:
          "Erro ao salvar PayPal"
      },

      {
        status:500
      }

    );

  }


            }
