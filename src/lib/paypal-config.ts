import { db } from "@/db";

import {
  paypalSettings
} from "@/db/schema";

import {
  desc
} from "drizzle-orm";

import {
  decrypt
} from "@/lib/crypto";



// =================================
// BUSCAR CONFIGURAÇÃO PAYPAL
// =================================

export async function getPaypalConfig(){

  const config =
    await db
      .select()
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

    throw new Error(
      "PayPal não configurado no painel admin"
    );

  }



  const paypal =
    config[0];



  return {

    id:
      paypal.id,


    clientId:
      paypal.clientId,


    clientSecret:
      decrypt(
        paypal.clientSecret
      ),


    mode:
      paypal.mode,


    senderEmail:
      paypal.senderEmail

  };

}



// =================================
// URL DA API PAYPAL
// =================================

export function getPaypalBaseUrl(
  mode:string
){

  if(mode === "live"){

    return (
      "https://api-m.paypal.com"
    );

  }


  return (
    "https://api-m.sandbox.paypal.com"
  );

}
