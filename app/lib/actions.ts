"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import postgres from "postgres"

// Creating Invoice
// 1.Create a form to capture the user's input.
// 2.Create a Server Action and invoke it from the form.
// 3.Inside your Server Action, extract the data from the formData object.
// 4.Validate and prepare the data to be inserted into your database.
// 5.Insert the data and handle any errors.
// 6.Revalidate the cache and redirect the user back to invoices page.

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" })
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(), // coerce means change: string -> number
    status: z.enum(["pending", "paid"]),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true })

const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    })
    // in cents to avoid floating-point erros
    const amountInCents = amount * 100
    // date-format: YYYY-MM-DD
    const date = new Date().toISOString().split("T")[0]

    await sql`INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `

    // nextjs store the route segments in cache for smooth navigation
    // since we are updating the data displayed in the invoices route we need to clear this cached and trigger new request to server for we use revalidatePath
    // once the database gets updated path will be revalidated and fresh data will be fetched from the server
    revalidatePath("/dashboard/invoices")
    redirect("/dashboard/invoices")
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    })

    const amountInCents = amount * 100

    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount=${amountInCents}, status = ${status}
    WHERE id = ${id}
    `
    revalidatePath("/dashboard/invoices")
    redirect("/dashboard/invoices")
}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`
    revalidatePath("/dashboard/invoices")
}
