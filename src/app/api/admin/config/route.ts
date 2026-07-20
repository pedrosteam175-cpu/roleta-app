import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appConfig } from "@/db/schema";
import { eq } from "drizzle-orm";


// =====================================
// GET CONFIG
// =====================================

export async function GET() {
  try {

    const rows = await db
      .select()
      .from(appConfig);


    const config: Record<string, string | null> = {};


    for (const row of rows) {

      if (!row.key) {
        continue;
      }


      if (
        row.key === "asaas_api_key" &&
        row.value
      ) {

        config[row.key] =
          "••••••••••••" +
          row.value.slice(-6);

      } else {

        config[row.key] =
          row.value ?? null;

      }

    }


    return NextResponse.json({
      config
    });


  } catch (error) {

    console.error(
      "CONFIG GET ERROR:",
      error
    );


    return NextResponse.json(
      {
        error: "Erro ao buscar configurações"
      },
      {
        status: 500
      }
    );

  }
}



// =====================================
// POST / UPDATE CONFIG
// =====================================

export async function POST(
  req: NextRequest
) {

  try {

    const body = await req.json();


    for (
      const [key, value]
      of Object.entries(body)
    ) {


      const existing =
        await db
          .select()
          .from(appConfig)
          .where(
            eq(
              appConfig.key,
              key
            )
          )
          .limit(1);



      if (existing.length > 0) {


        await db
          .update(appConfig)
          .set({
            value:
              String(value),
            updatedAt:
              new Date()
          })
          .where(
            eq(
              appConfig.key,
              key
            )
          );


      } else {


        await db
          .insert(appConfig)
          .values({

            key,

            value:
              String(value),

            createdAt:
              new Date(),

            updatedAt:
              new Date()

          });


      }

    }



    return NextResponse.json({
      success: true
    });



  } catch (error) {


    console.error(
      "CONFIG POST ERROR:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Erro ao salvar configurações"
      },
      {
        status:500
      }
    );

  }

          }
