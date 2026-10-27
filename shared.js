/* Shared code for the editor, the public card page and the admin page. */
(function () {
  const C = window.CARD_CONFIG || {};

  // Brand values: AIA Canada Visual Identity Guidelines (2024-10-22)
  // and I-CAR Canada Branding Guidelines (2022).
  const BRANDS = {
    aia: {
      name: "AIA Canada",
      web: "https://aiacanada.com",
      webLabel: "aiacanada.com",
      logo: "/assets/aia-canada-logo.png",
      ink: "#192B56"
    },
    icar: {
      name: "I-CAR Canada",
      web: "https://i-car.ca",
      webLabel: "i-car.ca",
      logo: "/assets/icar-canada-logo.png",
      ink: "#221F20"
    }
  };

  // Mailing address, the same for every AIA Canada and I-CAR Canada card.
  const ADDRESS = {
    street: "PO Box 11356 STN H",
    city: "Nepean",
    region: "ON",
    postal: "K2H 7V1",
    country: "Canada"
  };
  const addressLines = () => [ADDRESS.street, ADDRESS.city + ", " + ADDRESS.region + " " + ADDRESS.postal, ADDRESS.country];

  const T = {
    en: {
      // public card
      save: "Save contact",
      email: "Email",
      call: "Call",
      mobile: "Mobile",
      website: "Website",
      address: "Mailing address",
      linkedin: "LinkedIn",
      shareCard: "Share this card",
      hideQr: "Hide QR code",
      scanMe: "Scan to save my contact",
      viewCard: "View my card",
      sendLink: "Send link",
      installTip: "Keep your card one tap away.",
      installIos: "In Safari, tap Share, then “Add to Home Screen”.",
      installAndroid: "In Chrome, tap ⋮, then “Add to Home screen”.",
      dismiss: "Dismiss",
      myPhoneTitle: "Put your card on your phone",
      myPhoneBody: "Open this on your phone and add it to your home screen. It opens straight to your QR code, works without a signal, and keeps the screen on while people scan.",
      myPhoneBtn: "Open my phone card",
      scanToSave: "Scan to open this card",
      ext: "ext.",
      notFoundTitle: "This card isn’t available",
      notFoundBody: "The link may be mistyped, or the card may have been removed.",
      setupNeeded: "This site isn’t connected to its database yet. See SETUP.md, step 3.",
      // editor
      appTitle: "Your digital business card",
      signInIntro: "Create your AIA Canada or I-CAR Canada business card, then share it with a QR code or an NFC tap. Use your work email to register.",
      signIn: "Sign in",
      tabSignIn: "Sign in",
      tabRegister: "Create account",
      register: "Create account",
      password: "Password",
      passwordHint: "Use at least 8 characters.",
      forgot: "Forgot your password?",
      checkEmail: "Check your work email for a link to confirm your account, then come back and sign in.",
      notConfirmed: "Confirm your account first. Check your work email for the confirmation link.",
      alreadyRegistered: "There’s already an account with this email. Sign in instead.",
      badLogin: "The email or password is incorrect.",
      tooMany: "Too many attempts. Wait a few minutes and try again.",
      authError: "That didn’t work. Try again in a moment.",
      enterEmailFirst: "Enter your work email above, then select “Forgot your password?” again.",
      resetSent: "If there’s an account for this email, a link to reset your password is on its way.",
      newPassword: "New password",
      savePassword: "Save new password",
      signOut: "Sign out",
      notStaff: "Use your AIA Canada or I-CAR Canada work email (ending in @aiacanada.com or @i-car.ca).",
      organization: "Organization",
      cardLanguage: "Card opens in",
      first: "First name",
      last: "Last name",
      titleEn: "Job title (English)",
      titleFr: "Job title (French)",
      workEmail: "Work email",
      workEmailHint: "Uses the email you signed in with.",
      workPhone: "Work phone",
      workExt: "Ext.",
      mobileLabel: "Mobile",
      showMobile: "Show my mobile number on my card",
      linkedinLabel: "LinkedIn profile (optional)",
      photo: "Photo (optional)",
      photoHint: "A square, professional headshot works best.",
      removePhoto: "Remove photo",
      slug: "Card address",
      publishedLabel: "Make my card public",
      publishedHint: "Turn this off to hide your card without deleting it.",
      saveCard: "Save card",
      saving: "Saving…",
      saved: "Card saved.",
      slugTaken: "That card address is already in use. Try adding your middle initial.",
      saveError: "Your card couldn’t be saved. Check the highlighted fields and try again.",
      yourCard: "Your card",
      yourCardHint: "This link never changes, so your QR code and NFC tag keep working when you update your details.",
      copyLink: "Copy link",
      copied: "Link copied.",
      openCard: "Open my card",
      downloadQr: "Download QR code",
      nfcTitle: "Share by NFC tap",
      writeNfc: "Write to NFC tag",
      nfcReady: "Hold a blank NFC tag to the back of your phone.",
      nfcDone: "NFC tag written. Tap it with any phone to open your card.",
      nfcFail: "The tag couldn’t be written. Make sure it’s blank and unlocked, then try again.",
      nfcOther: "Ask Marcom for a programmed NFC card or sticker. To write one yourself, use the free NFC Tools app: Write, then Add a record, then URL, and paste your card link.",
      nameDrop: "Using an iPhone? Set up your own contact card in the Contacts app to swap details with other iPhones using NameDrop.",
      admin: "Marcom admin",
      saveFirst: "Save your card to get your link and QR code."
    },
    fr: {
      save: "Enregistrer le contact",
      email: "Courriel",
      call: "Appeler",
      mobile: "Cellulaire",
      website: "Site Web",
      address: "Adresse postale",
      linkedin: "LinkedIn",
      shareCard: "Partager cette carte",
      hideQr: "Masquer le code QR",
      scanMe: "Balayez pour enregistrer mes coordonnées",
      viewCard: "Voir ma carte",
      sendLink: "Envoyer le lien",
      installTip: "Gardez votre carte à portée de main.",
      installIos: "Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».",
      installAndroid: "Dans Chrome, touchez ⋮, puis « Ajouter à l’écran d’accueil ».",
      dismiss: "Fermer",
      myPhoneTitle: "Votre carte sur votre téléphone",
      myPhoneBody: "Ouvrez ce lien sur votre téléphone et ajoutez-le à votre écran d’accueil. Il s’ouvre directement sur votre code QR, fonctionne sans réseau et garde l’écran allumé pendant qu’on le balaie.",
      myPhoneBtn: "Ouvrir ma carte mobile",
      scanToSave: "Balayez pour ouvrir cette carte",
      ext: "poste",
      notFoundTitle: "Cette carte n’est pas disponible",
      notFoundBody: "Le lien est peut-être mal saisi, ou la carte a été retirée.",
      setupNeeded: "Ce site n’est pas encore relié à sa base de données. Consultez SETUP.md, étape 3.",
      appTitle: "Votre carte professionnelle numérique",
      signInIntro: "Créez votre carte professionnelle de l’AIA Canada ou d’I-CAR Canada, puis partagez-la au moyen d’un code QR ou d’un contact NFC. Inscrivez-vous avec votre courriel professionnel.",
      signIn: "Se connecter",
      tabSignIn: "Se connecter",
      tabRegister: "Créer un compte",
      register: "Créer un compte",
      password: "Mot de passe",
      passwordHint: "Utilisez au moins 8 caractères.",
      forgot: "Mot de passe oublié?",
      checkEmail: "Consultez votre courriel professionnel pour confirmer votre compte, puis revenez vous connecter.",
      notConfirmed: "Confirmez d’abord votre compte. Le lien de confirmation se trouve dans votre courriel professionnel.",
      alreadyRegistered: "Un compte existe déjà pour ce courriel. Connectez-vous plutôt.",
      badLogin: "Le courriel ou le mot de passe est incorrect.",
      tooMany: "Trop de tentatives. Attendez quelques minutes et réessayez.",
      authError: "Cela n’a pas fonctionné. Réessayez dans un instant.",
      enterEmailFirst: "Entrez votre courriel professionnel ci-dessus, puis sélectionnez de nouveau « Mot de passe oublié? ».",
      resetSent: "S’il existe un compte pour ce courriel, un lien pour réinitialiser votre mot de passe vous a été envoyé.",
      newPassword: "Nouveau mot de passe",
      savePassword: "Enregistrer le nouveau mot de passe",
      signOut: "Se déconnecter",
      notStaff: "Utilisez votre courriel professionnel de l’AIA Canada ou d’I-CAR Canada (se terminant par @aiacanada.com ou @i-car.ca).",
      organization: "Organisation",
      cardLanguage: "Langue d’ouverture de la carte",
      first: "Prénom",
      last: "Nom",
      titleEn: "Titre du poste (anglais)",
      titleFr: "Titre du poste (français)",
      workEmail: "Courriel professionnel",
      workEmailHint: "Il s’agit du courriel utilisé pour vous connecter.",
      workPhone: "Téléphone au travail",
      workExt: "Poste",
      mobileLabel: "Cellulaire",
      showMobile: "Afficher mon numéro de cellulaire sur ma carte",
      linkedinLabel: "Profil LinkedIn (facultatif)",
      photo: "Photo (facultatif)",
      photoHint: "Une photo carrée et professionnelle donne le meilleur résultat.",
      removePhoto: "Retirer la photo",
      slug: "Adresse de la carte",
      publishedLabel: "Rendre ma carte publique",
      publishedHint: "Désactivez cette option pour masquer votre carte sans la supprimer.",
      saveCard: "Enregistrer la carte",
      saving: "Enregistrement…",
      saved: "Carte enregistrée.",
      slugTaken: "Cette adresse de carte est déjà utilisée. Essayez d’ajouter l’initiale de votre deuxième prénom.",
      saveError: "Votre carte n’a pas pu être enregistrée. Vérifiez les champs signalés et réessayez.",
      yourCard: "Votre carte",
      yourCardHint: "Ce lien ne change jamais : votre code QR et votre puce NFC continuent de fonctionner quand vous mettez vos coordonnées à jour.",
      copyLink: "Copier le lien",
      copied: "Lien copié.",
      openCard: "Ouvrir ma carte",
      downloadQr: "Télécharger le code QR",
      nfcTitle: "Partager par contact NFC",
      writeNfc: "Écrire sur une puce NFC",
      nfcReady: "Tenez une puce NFC vierge contre le dos de votre téléphone.",
      nfcDone: "Puce NFC écrite. Touchez-la avec n’importe quel téléphone pour ouvrir votre carte.",
      nfcFail: "La puce n’a pas pu être écrite. Assurez-vous qu’elle est vierge et déverrouillée, puis réessayez.",
      nfcOther: "Demandez à l’équipe Marcom une carte ou un autocollant NFC programmé. Pour en écrire un vous-même, utilisez l’application gratuite NFC Tools : Écrire, puis Ajouter un enregistrement, puis URL, et collez le lien de votre carte.",
      nameDrop: "Vous utilisez un iPhone? Créez votre propre fiche dans l’application Contacts pour échanger vos coordonnées avec d’autres iPhone au moyen de NameDrop.",
      admin: "Administration Marcom",
      saveFirst: "Enregistrez votre carte pour obtenir votre lien et votre code QR."
    }
  };

  function configured() {
    return !!(C.supabaseUrl && C.supabaseAnonKey &&
      !C.supabaseUrl.includes("YOUR-PROJECT") && !C.supabaseAnonKey.includes("YOUR-ANON"));
  }

  let _client = null;
  function client() {
    if (!_client && configured() && window.supabase) {
      _client = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
        auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" }
      });
    }
    return _client;
  }

  function siteUrl() {
    return (C.siteUrl || location.origin).replace(/\/$/, "");
  }
  function cardUrl(slug) { return siteUrl() + "/" + slug; }

  function photoUrl(p) {
    if (!p || !p.photo_path) return "";
    const v = p.updated_at ? "?v=" + encodeURIComponent(p.updated_at) : "";
    return C.supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/public/photos/" + p.photo_path + v;
  }

  function emailAllowed(email) {
    const e = String(email || "").toLowerCase();
    return (C.allowedDomains || []).some(d => e.endsWith("@" + d.toLowerCase()));
  }

  function slugify(first, last) {
    return [first, last].join(" ").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }

  function title(p, lang) {
    return (lang === "fr" ? (p.title_fr || p.title_en) : (p.title_en || p.title_fr)) || "";
  }

  function withScheme(u) {
    u = String(u || "").trim();
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }

  function telHref(num, ext) {
    const n = String(num || "").replace(/[^\d+]/g, "");
    return "tel:" + n + (ext ? "," + String(ext).replace(/\D/g, "") : "");
  }

  // ---------- vCard 3.0 ----------
  function esc(v) {
    return String(v).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }
  function fold(line) {
    if (line.length <= 74) return line;
    const out = [line.slice(0, 74)];
    for (let i = 74; i < line.length; i += 73) out.push(" " + line.slice(i, i + 73));
    return out.join("\r\n");
  }
  function vcard(p, lang, photoBase64) {
    const b = BRANDS[p.org] || BRANDS.aia;
    const L = ["BEGIN:VCARD", "VERSION:3.0"];
    L.push("N:" + esc(p.last_name) + ";" + esc(p.first_name) + ";;;");
    L.push("FN:" + esc(p.first_name + " " + p.last_name));
    L.push("ORG:" + esc(b.name));
    const t = title(p, lang);
    if (t) L.push("TITLE:" + esc(t));
    L.push("EMAIL;TYPE=INTERNET,WORK:" + p.email);
    if (p.work_phone) {
      const n = String(p.work_phone).replace(/[^\d+]/g, "");
      L.push("TEL;TYPE=WORK,VOICE:" + n + (p.work_ext ? "," + String(p.work_ext).replace(/\D/g, "") : ""));
    }
    if (p.show_mobile && p.mobile) L.push("TEL;TYPE=CELL:" + String(p.mobile).replace(/[^\d+]/g, ""));
    L.push("ADR;TYPE=WORK,POSTAL:;;" + esc(ADDRESS.street) + ";" + esc(ADDRESS.city) + ";" + esc(ADDRESS.region) + ";" +
      esc(ADDRESS.postal) + ";" + esc(ADDRESS.country));
    L.push("URL;TYPE=WORK:" + b.web);
    if (p.linkedin) L.push("X-SOCIALPROFILE;TYPE=linkedin:" + withScheme(p.linkedin));
    L.push("NOTE:" + esc(cardUrl(p.slug)));
    if (photoBase64) L.push("PHOTO;ENCODING=b;TYPE=JPEG:" + photoBase64);
    L.push("END:VCARD");
    return L.map(fold).join("\r\n") + "\r\n";
  }

  // ---------- QR codes ----------
  if (window.qrcode && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs["UTF-8"]) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  }
  function makeQr(text) {
    const q = qrcode(0, "M"); q.addData(text); q.make(); return q;
  }
  function qrSvg(text, quiet) {
    quiet = quiet == null ? 2 : quiet;
    const q = makeQr(text), n = q.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += "M" + c + " " + r + "h1v1h-1z";
    const s = n + quiet * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (-quiet) + " " + (-quiet) + " " + s + " " + s +
      '" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect x="' + (-quiet) + '" y="' + (-quiet) +
      '" width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  function qrPng(text, lines, ink) {
    const q = makeQr(text), n = q.getModuleCount(), quiet = 4;
    const W = 1200, size = 1000, cell = size / (n + quiet * 2);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = 1380;
    const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, cv.height);
    g.fillStyle = "#000";
    const ox = (W - size) / 2, oy = 50;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c))
      g.fillRect(Math.floor(ox + (c + quiet) * cell), Math.floor(oy + (r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
    g.textAlign = "center"; g.fillStyle = ink || "#192B56";
    g.font = "700 58px Arial, sans-serif"; g.fillText(lines[0] || "", W / 2, 1140);
    g.font = "400 38px Arial, sans-serif"; g.fillText(lines[1] || "", W / 2, 1205);
    return new Promise(res => cv.toBlob(res, "image/png"));
  }

  function download(filename, blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // Resize and centre-crop a photo to a square JPEG.
  function squareJpeg(file, px) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        const cv = document.createElement("canvas"); cv.width = cv.height = px;
        cv.getContext("2d").drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, px, px);
        URL.revokeObjectURL(img.src);
        cv.toBlob(b => b ? resolve(b) : reject(new Error("resize")), "image/jpeg", 0.85);
      };
      img.onerror = () => reject(new Error("image"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function fetchBase64(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) return "";
      const buf = new Uint8Array(await r.arrayBuffer());
      let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return btoa(s);
    } catch (e) { return ""; }
  }

  window.Cards = {
    C, BRANDS, ADDRESS, addressLines, T, configured, client, siteUrl, cardUrl, photoUrl, emailAllowed, slugify, title,
    withScheme, telHref, vcard, qrSvg, qrPng, download, squareJpeg, fetchBase64
  };
})();
