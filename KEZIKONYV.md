# ULWILA Színes Kotta Szerkesztő — Kézikönyv

Ez a program színes kottát készít az **ULWILA módszer** szerint. Nem kell hozzá
kottaolvasás: a gyereknek elég a színeket felismernie.

A kézikönyv a program használatáról szól. Magáról a módszerről a végén, a
[Források](#források) alatt találsz irodalmat.

---

## Tartalom

1. [Az első kotta öt lépésben](#az-első-kotta-öt-lépésben)
2. [A képernyő](#a-képernyő)
3. [Hangok felvétele](#hangok-felvétele)
4. [Javítás: kijelölés és szerkesztés](#javítás-kijelölés-és-szerkesztés)
5. [Beszúrás és törlés](#beszúrás-és-törlés)
6. [Dalszöveg](#dalszöveg)
7. [A kotta tagolása](#a-kotta-tagolása)
8. [Ismétlés](#ismétlés)
9. [A két nézet](#a-két-nézet)
10. [Nyomtatás és mentés](#nyomtatás-és-mentés)
11. [Billentyűparancsok](#billentyűparancsok)
12. [Jelmagyarázat](#jelmagyarázat)
13. [Gyakori kérdések](#gyakori-kérdések)

---

## Az első kotta öt lépésben

Vegyük a „Csiga-biga" első sorát.

1. **Írd be a dal címét** a bal felső mezőbe.
2. **Állítsd be az ütemmutatót** — ehhez a dalhoz `2/4`.
3. **Válts „Körök" nézetre**, ha a tiszta ULWILA-képet szeretnéd.
4. **Vedd fel a hangokat**: kattints egy színre, állítsd be az időtartamot,
   majd nyomd meg a **Hang hozzáadása** gombot. Ismételd minden hangra.
5. **Exportáld PDF-be** a `PDF` gombbal — ez a nyomtatható változat.

A többi (szöveg, tagolás, ismétlés) mind ráér utólag: a kottát bármikor
tovább lehet szerkeszteni.

---

## A képernyő

Nagy képernyőn három hasáb van egymás mellett:

```
┌──────────────────────────────────────────────────────┐
│  cím · ütemmutató · kulcs · nézet · nyelv · export   │  eszköztár
├────────────┬────────────┬────────────────────────────┤
│  bevitel   │ szerkesztő │        a kotta             │
│  (új hang) │ (kijelölt  │                            │
│            │  elem)     │                            │
└────────────┴────────────┴────────────────────────────┘
```

- **Bevitel** (bal): innen kerülnek be az **új** hangok és szünetek.
- **Szerkesztő** (közép): a **már meglévő**, kijelölt elemet módosítja.
  Üres, amíg nincs kijelölve semmi.
- **Kotta** (jobb): maga a mű. Ide kattintva jelölsz ki elemeket.

Keskenyebb képernyőn ugyanezek egymás alatt jelennek meg.

> **A leggyakoribb félreértés:** a bal panel *új* hangot ad hozzá, a középső a
> *meglévőt* javítja. Ha egy már felvett hang színét akarod megváltoztatni, ne
> a bal oldalon kattints — jelöld ki a hangot, és a középső panelt használd.

---

## Hangok felvétele

A bal oldali panelen:

| Vezérlő | Mit csinál |
|---|---|
| **7 színes gomb** | a hang magassága: C, D, E, F, G, A, H |
| **♯** | módosított hang (fekete billentyű), pl. F♯ |
| **Időtartam** | Egész · Fél · Negyed · Nyolcad · Tizenhatod |
| **Oktáv** | Alsó · Közép · Felső |
| **Hang hozzáadása** | felveszi a beállított hangot |
| **Szünet hozzáadása** | szünetet vesz fel a beállított időtartammal |

A beállítások **megmaradnak**, tehát ha öt negyed hangot akarsz egymás után,
elég egyszer beállítani az időtartamot, és csak a színt váltogatni.

A **♯ gomb** csak azoknál a hangoknál aktív, amelyeknek van fekete billentyűjük
(C, D, F, G, A). Az E és a H után közvetlenül félhang következik, ezért nekik
nincs keresztjük — ilyenkor a gomb szürke.

---

## Javítás: kijelölés és szerkesztés

**Kattints egy elemre a kottában** — kék keret jelzi, hogy ki van jelölve, és
középen megjelenik a szerkesztő panel.

Amit ott állíthatsz:

| Vezérlő | Hangra | Szünetre |
|---|---|---|
| hangmagasság (7 szín) | ✔ | — |
| Időtartam | ✔ | ✔ |
| Oktáv | ✔ | — |
| Módosított ♯ | ✔ (C, D, F, G, A) | — |
| Hangsúlyjel, Szóköz, Sortörés, Ismétlés | ✔ | ✔ |
| Átalakítás szünetté / hanggá | ✔ | ✔ |
| Törlés | ✔ | ✔ |

Ami az adott elemre nem alkalmazható, az **szürke** — nem attól nem működik,
hogy elromlott.

### Hangból szünet, szünetből hang

Az **Átalakítás szünetté** (illetve **Átalakítás hanggá**) gomb a helyén
cseréli ki az elemet. Megmarad az időtartam és minden jelölés (hangsúlyjel,
szóköz, sortörés, ismétlés), mert ezek az elem *helyéről* szólnak, nem a
hangzásáról.

A **beírt szótag sem vész el**: a szünet megőrzi rejtve, és ha visszaalakítod
hanggá, a szöveg visszajön. Szünetből hang esetén a program a bal oldali
panelen éppen kiválasztott színt és oktávot használja.

---

## Beszúrás és törlés

**Beszúrás:** jelöld ki azt az elemet, ami **után** be akarsz szúrni. A bal
oldali gombok felirata ilyenkor átvált **Hang beszúrása** / **Szünet
beszúrása** szövegre — ez mutatja, hogy most nem a végére kerül. A kijelölés
automatikusan az új elemre ugrik, tehát egymás után többet is beszúrhatsz.

Ha **nincs kijelölve semmi**, a gomb felirata **Hang hozzáadása**, és az új
elem a kotta végére kerül.

**Törlés:** jelöld ki az elemet, majd **Törlés** gomb, vagy a `Delete` /
`Backspace` billentyű.

---

## Dalszöveg

Jelölj ki egy hangot, és a szerkesztő panel alján, a **Dalszöveg → Szótag**
mezőbe írd be a szótagot. A kottában a hang alatt jelenik meg.

Szüneten nincs szövegmező — a szünet alá nem kerül szótag.

---

## A kotta tagolása

Az ULWILA-kották nem futnak egybe: a hangok **szavakba vannak csoportosítva**,
a szótagokhoz igazítva. Erre két eszköz van.

### Szóköz

A **Szóköz ␣** gomb sima térközt tesz a kijelölt elem után:

```
(Bo)(ci)  (bo)(ci)  (tar)(ka)
```

Ez **nem szünet**. Nincs időtartama, nem hallatszik, csak széthúzza a képet.
A szünetnek külön jele van (üres hatszög) — a szóköz semmit nem rajzol.

### Sortörés

A **Sortörés ↵** gomb az adott elem után új sorba viszi a kottát. Így a dal
sorai ott törnek meg, ahol a szöveg sorai, nem ott, ahol a papír elfogy.

### Hangsúlyjel

Az ULWILA nem használ ütemvonalat: az ütem elejét **fekete háromszög** jelzi a
hang fölött. A program ezt **magától kiteszi** az ütemmutató alapján — nincs
vele dolgod.

Ha mégis máshova kell (például felütéssel induló dalnál), a **Hangsúlyjel ▼**
gomb három állapoton jár körbe:

| Állapot | Jelentés |
|---|---|
| **auto** | a program dönt az ütemmutatóból |
| **be** | ide mindenképp kerüljön jel |
| **ki** | ide semmiképp |

---

## Ismétlés

Ha egy szakasz kétszer hangzik el, nem kell kétszer beírni.

1. Jelöld ki a szakasz **első** elemét → **𝄆 Ismétlés innen**
2. Jelöld ki a szakasz **utolsó** elemét → **𝄇 Ismétlés eddig**

A szakasz két oldalán megjelenik a hagyományos ismétlőjel: két függőleges
vonal és két pont, a pontok az ismételt rész felé néznek.

Ha csak a **végjelet** teszed ki, az ismétlés a dal elejétől értendő — ez a
hagyományos kottában is így van. Ha csak a **kezdőjelet**, akkor a dal végéig.

> **Fontos:** az ismétlőjel a program saját konvenciója. Az ULWILA módszer
> irodalmában nincs ismétlőjel, ezért a hagyományos kotta jelét vettük át —
> amit a gyerek később a rendes kottában is viszontlát. Ezt tanítani kell,
> nem magától értetődő.

---

## A két nézet

Az eszköztár **Kotta** / **Körök** gombjával váltasz. Ugyanaz a dal, két
megjelenítésben — a váltás nem módosít semmit, bármikor oda-vissza mehetsz.

**Körök** — a tiszta ULWILA-kép: színes körök, kottavonalak nélkül.

**Kotta** — hagyományos ötvonalas kotta, de a hangjegyfejek ULWILA-színűek.
Ez a **híd** a rendes kottaíráshoz: aki már ismeri a színeket, itt kezdheti
megszokni a vonalrendszert.

Néhány dolog csak az egyik nézetben látszik:

| | Körök | Kotta |
|---|---|---|
| hangsúlyjel ▼ | ✔ | — (helyette ütemvonal) |
| szóköz | ✔ | — |
| sortörés | ✔ | ✔ |
| ismétlőjel | ✔ | ✔ |
| kulcs (violin/basszus) | — | ✔ |

A szóköz és a hangsúlyjel gombja kotta nézetben is használható: az adat
rögzül, és körök nézetre váltva látszik. A **kulcsválasztó** viszont körök
nézetben szürke, mert ott nincsenek kottavonalak, amikhez viszonyítson.

---

## Nyomtatás és mentés

| Gomb | Mire jó |
|---|---|
| **PDF** | **ez a nyomtatáshoz való** — A4, margókkal, több oldalra tördelve |
| **PNG** | kép, munkalapba vagy prezentációba illesztéshez |
| **SVG** | kép, ami nagyításnál sem pixelesedik |
| **Mentés** | a kotta elmentése fájlba, hogy később tovább szerkeszthesd |
| **Betöltés** | korábban mentett kotta visszatöltése |

Az export mindig azt a nézetet menti, amelyik éppen látszik. Ha a színes
körös változatot akarod kinyomtatni, előbb válts **Körök** nézetre.

> A **Mentés** és a **PDF** nem ugyanaz. A PDF nyomtatáshoz jó, de nem lehet
> visszatölteni szerkesztésre. Ha később még dolgoznál a dalon, **mentsd el**
> is, ne csak exportáld.

Ha a betöltött fájl hibás, a program **megmondja, mi a baj**, és a megnyitott
kotta érintetlen marad.

---

## Billentyűparancsok

Kijelölt elem mellett:

| Billentyű | Mit csinál |
|---|---|
| `→` `←` | lépés a következő / előző elemre |
| `Shift` + `→` `←` | kijelölés kiterjesztése több elemre |
| `Home` / `End` | ugrás az első / utolsó elemre |
| `Enter` | sortörés be/ki az adott elem után |
| `Delete` / `Backspace` | a kijelölt elem(ek) törlése |
| `Esc` | kijelölés megszüntetése |

---

## Jelmagyarázat

### Színek

| Hang | Szín | Hang | Szín |
|---|---|---|---|
| C (Dó) | fekete | G (Szó) | piros |
| D (Ré) | barna | A (Lá) | narancs |
| E (Mi) | kék | H (Ti) | sárga |
| F (Fá) | zöld | | |

### Oktáv

| Oktáv | Jel |
|---|---|
| alsó | kis **fekete** pont a kör közepén |
| közép | nincs pont |
| felső | kis **fehér** pont a kör közepén |

Ahol a pont beleolvadna a hang színébe (például fekete pont a fekete C-n),
a program **kontrasztos gyűrűt** rajzol köré, hogy látszódjon.

### Hangértékek

| Érték | Hangjel | Szünetjel |
|---|---|---|
| egész | négy összeérő kör | négy üres hatszög |
| fél | két összeérő kör | két üres hatszög |
| negyed | egy kör | egy üres hatszög |
| nyolcad | **félkör**, jobbra egyenes éllel | fél hatszög |
| tizenhatod | **keskeny pálcika** | üres pálcika |

Két nyolcad vagy négy tizenhatod pontosan egy negyed helyét tölti ki.

### Egyéb jelek

| Jel | Jelentés |
|---|---|
| ▼ fekete háromszög | ütem eleje (az ütemvonal helyett) |
| kétszínű kör | módosított hang, pl. F♯ = fél zöld, fél piros |
| 𝄆 … 𝄇 | ismételt szakasz |

---

## Gyakori kérdések

**Elrontottam egy hangot, muszáj mindent újraírni?**
Nem. Kattints rá, és a középső panelen javítsd — színt, időtartamot, oktávot,
vagy akár szünetté alakítsd.

**Kimaradt egy hang a dal közepéről.**
Jelöld ki az előtte lévőt, és nyomd meg a **Hang beszúrása** gombot.

**A gomb „hozzáadása" helyett „beszúrása" lett.**
Ez azt jelenti, hogy van kijelölt elem, és az új hang **utána** kerül, nem a
végére. Ha a végére akarod, `Esc`-cel szüntesd meg a kijelölést.

**Miért szürke a ♯ gomb?**
Mert E vagy H hang van kijelölve, azoknak nincs keresztjük.

**Miért szürke a kulcsválasztó?**
Mert körök nézetben vagy, ahol nincsenek kottavonalak. Válts kotta nézetre.

**Betettem szóközt, de nem látok semmit kotta nézetben.**
A szóköz csak körök nézetben rajzolódik. Az adat megvan, váltás után látszik.

**Nem tudok visszavonni egy műveletet.**
A programban jelenleg nincs visszavonás. Ezért érdemes hosszabb munka közben
időnként **menteni**. (Az egyetlen kivétel: a hang→szünet átalakítás megőrzi a
beírt szótagot, hogy egy félrekattintás ne vigye el.)

**Offline is működik?**
A kotta és a színek igen. A kotta nézet kulcsjeléhez a program internetről tölt
le egy betűkészletet — internet nélkül a kulcs egy tartalék jellel jelenik meg,
minden más változatlan.

---

## Források

- Vető Anna – Ullrich, Heinrich (1997): *ULWILA Színeskotta. Tanári kézikönyv
  zeneoktatáshoz.* Budapest: Down Alapítvány Kiadó.
- Bakos Anita (2014): [Zenetanulás színesen](https://www.parlando.hu/2014/2014-3/Bakos_Anita_Zenetanulas.pdf) (Parlando)
- Down Alapítvány — [ULWILA Színeskotta](https://www.downalapitvany.hu/node/145)
