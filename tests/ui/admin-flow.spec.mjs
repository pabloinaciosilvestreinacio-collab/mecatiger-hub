import {test,expect} from "@playwright/test";
import {installLocalApp,waitForConfirmationLink} from "./local-app.mjs";

test("painel requer concessão e permite edição e foto por integrante autorizado", async ({context,page})=>{
  test.setTimeout(90_000);
  await installLocalApp(context,true);
  const email="editor-web-"+Date.now()+"@mecatiger.invalid";
  await page.goto("/admin.html");
  await expect(page.locator("#admin-content")).toBeHidden();
  await expect(page.locator("#admin-locked")).toBeVisible();

  await page.goto("/entrar.html?next=admin.html");
  await page.locator("#auth-email").fill(email);
  await page.getByRole("button",{name:"Solicitar link de acesso"}).click();
  await expect(page.locator("#auth-status")).toContainText("Confira seu e-mail");
  const link=await waitForConfirmationLink(email);
  await page.goto(link);
  await page.waitForURL(/\/admin\.html$/,{timeout:20000});
  await expect(page.locator("#admin-locked")).toBeVisible();
  await expect(page.locator("#admin-content")).toBeHidden();
  await expect(page.locator("#admin-status")).toContainText("não tem papel de editor ou moderador");

  const userId=await page.evaluate(async()=>{
    const {supabase}=await import("/js/rede-client.js");
    return (await supabase.auth.getUser()).data.user?.id;
  });
  expect(userId).toMatch(/^[0-9a-f-]{36}$/);
  // Grant is performed ONLY in the disposable test runner (never browser or production).
  const endpoint=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!endpoint || !key || !["127.0.0.1","localhost"].includes(new URL(endpoint).hostname))
    throw Error("Refusing non-local browser editor fixture");
  const grant=await fetch(new URL("/rest/v1/meca_site_editors",endpoint),{
    method:"POST",
    headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({user_id:userId}),
    signal:AbortSignal.timeout(12000)
  });
  expect(grant.status).toBe(201);

  await page.reload();
  await expect(page.locator("#admin-content")).toBeVisible();
  await page.locator("#admin-tab-copy").click();
  const editorText="Texto de integração publicado no site apenas pelo editor autorizado em teste local.";
  await page.locator("#cms-slot").selectOption("home-intro");
  await page.locator("#cms-body").fill(editorText);
  await page.locator("#cms-copy-form button[type=submit]").click();
  await expect(page.locator("#cms-copy-status")).toContainText("Texto salvo");

  await page.locator("#admin-tab-photos").click();
  const webp=Buffer.from("UklGRjoAAABXRUJQVlA4IC4AAAAQAgCdASoCAAIAAkA4JaACdLoB+AH4AAPIAP7n5L/6nAk8B/Br/9JoQ9W/KwAA","base64");
  await page.locator("#cms-photo").setInputFiles({name:"foto.webp",mimeType:"image/webp",buffer:webp});
  await page.locator("#cms-caption").fill("Foto homologada pela equipe");
  await page.locator("#cms-photo-form button[type=submit]").click();
  await expect(page.locator("#cms-photo-status")).toContainText("Foto publicada",{timeout:15000});

  await page.goto("/index.html");
  await expect(page.locator('[data-cms-text="home-intro"]')).toHaveText(editorText,{timeout:10000});
  await expect(page.locator("#meca-gallery")).toBeVisible();
  // A separate local CMS security suite also uploads a legitimate fixture.
  // Verify THIS browser upload is rendered, not the global gallery count.
  await expect(page.locator("#meca-photo-gallery figcaption").filter({hasText:"Foto homologada pela equipe"})).toHaveCount(1);
});
