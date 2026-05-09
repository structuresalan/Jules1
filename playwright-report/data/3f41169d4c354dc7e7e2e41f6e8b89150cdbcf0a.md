# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-workspace-tools.spec.ts >> Visual Workspace pressable control coverage >> workspace button 03 - Structural is pressable without crashing
- Location: tests\visual-workspace-tools.spec.ts:293:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('body')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('body')
    9 × locator resolved to <body data-website-accent="blue" data-website-style="desktop-glass" data-website-density="comfortable">…</body>
      - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e5]
        - generic [ref=e10]: SimplifyStruct
      - navigation [ref=e11]:
        - button "Workspace" [ref=e12] [cursor=pointer]
        - button "Review" [ref=e13] [cursor=pointer]
        - button "Report" [ref=e14] [cursor=pointer]
        - button "Export" [ref=e15] [cursor=pointer]
      - generic [ref=e16]:
        - generic [ref=e17]:
          - text: "Project: 1234 - Riverside Office Building"
          - img [ref=e18]
        - combobox "Engineer can edit. Client can comment only." [ref=e20]:
          - option "Engineer" [selected]
          - option "Client"
        - button "Clear board search" [ref=e21] [cursor=pointer]:
          - img [ref=e22]
        - button "Show board markups" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
        - button [ref=e29] [cursor=pointer]:
          - img [ref=e30]
        - button [ref=e33] [cursor=pointer]:
          - img [ref=e34]
        - generic [ref=e37]: AM
    - generic [ref=e38]:
      - generic [ref=e39]:
        - generic [ref=e40]:
          - button "Select" [ref=e41] [cursor=pointer]:
            - img [ref=e42]
            - generic [ref=e44]: Select
          - button "Pan" [ref=e45] [cursor=pointer]:
            - img [ref=e46]
            - generic [ref=e51]: Pan
          - button "Zoom" [ref=e52] [cursor=pointer]:
            - img [ref=e53]
            - generic [ref=e56]: Zoom
          - button "Fit" [ref=e57] [cursor=pointer]:
            - img [ref=e58]
            - generic [ref=e63]: Fit
          - button "Zoom Area" [ref=e64] [cursor=pointer]:
            - img [ref=e65]
            - generic [ref=e68]: Zoom Area
        - generic [ref=e69]: Navigate
      - generic [ref=e70]:
        - generic [ref=e71]:
          - button "Arrow" [ref=e72] [cursor=pointer]:
            - img [ref=e73]
            - generic [ref=e75]: Arrow
          - button "Cloud" [ref=e76] [cursor=pointer]:
            - img [ref=e77]
            - generic [ref=e79]: Cloud
          - button "Text" [ref=e80] [cursor=pointer]:
            - img [ref=e81]
            - generic [ref=e83]: Text
          - button "Box" [ref=e84] [cursor=pointer]:
            - img [ref=e85]
            - generic [ref=e87]: Box
          - button "Callout" [ref=e88] [cursor=pointer]:
            - img [ref=e89]
            - generic [ref=e91]: Callout
          - button "Dimension" [ref=e92] [cursor=pointer]:
            - img [ref=e93]
            - generic [ref=e99]: Dimension
        - generic [ref=e100]: Markup
      - generic [ref=e101]:
        - generic [ref=e102]:
          - button "Distance" [ref=e103] [cursor=pointer]:
            - img [ref=e104]
            - generic [ref=e110]: Distance
          - button "Angle" [ref=e111] [cursor=pointer]:
            - img [ref=e112]
            - generic [ref=e114]: Angle
          - button "Area" [ref=e115] [cursor=pointer]:
            - img [ref=e116]
            - generic [ref=e118]: Area
        - generic [ref=e119]: Measure
      - generic [ref=e120]:
        - generic [ref=e121]:
          - button "Note" [ref=e122] [cursor=pointer]:
            - img [ref=e123]
            - generic [ref=e126]: Note
          - button "Photo" [ref=e127] [cursor=pointer]:
            - img [ref=e128]
            - generic [ref=e131]: Photo
          - button "File" [ref=e132] [cursor=pointer]:
            - img [ref=e133]
            - generic [ref=e136]: File
          - button "Link" [ref=e137] [cursor=pointer]:
            - img [ref=e138]
            - generic [ref=e141]: Link
        - generic [ref=e142]: Insert
      - generic [ref=e143]:
        - generic [ref=e144]:
          - button "Highlighter" [ref=e145] [cursor=pointer]:
            - img [ref=e146]
            - generic [ref=e149]: Highlighter
          - button "Pen" [ref=e150] [cursor=pointer]:
            - img [ref=e151]
            - generic [ref=e153]: Pen
          - button "Eraser" [ref=e154] [cursor=pointer]:
            - img [ref=e155]
            - generic [ref=e157]: Eraser
          - button "Color" [ref=e158] [cursor=pointer]:
            - img [ref=e159]
            - generic [ref=e165]: Color
        - generic [ref=e166]: Annotate
      - generic [ref=e167]:
        - generic [ref=e168]:
          - button "Layers" [ref=e169] [cursor=pointer]:
            - img [ref=e170]
            - generic [ref=e174]: Layers
          - button "Scale" [ref=e175] [cursor=pointer]:
            - img [ref=e176]
            - generic [ref=e182]: Scale
          - button "Grid" [ref=e183] [cursor=pointer]:
            - img [ref=e184]
            - generic [ref=e186]: Grid
          - button "Snap" [ref=e187] [cursor=pointer]:
            - img [ref=e188]
            - generic [ref=e191]: Snap
        - generic [ref=e192]: Layers
      - generic [ref=e193]:
        - generic [ref=e194]:
          - button "Undo" [ref=e195] [cursor=pointer]:
            - img [ref=e196]
            - generic [ref=e199]: Undo
          - button "Redo" [ref=e200] [cursor=pointer]:
            - img [ref=e201]
            - generic [ref=e204]: Redo
          - button "More" [ref=e205] [cursor=pointer]:
            - img [ref=e206]
            - generic [ref=e210]: More
        - generic [ref=e211]: Edit
  - generic [ref=e212]:
    - complementary [ref=e213]:
      - generic [ref=e214]:
        - generic [ref=e215]:
          - generic [ref=e216]: Project
          - button [ref=e217] [cursor=pointer]:
            - img [ref=e218]
        - generic [ref=e222]: 1234 - Riverside Office Building
      - generic [ref=e223]:
        - generic [ref=e224]:
          - heading "Boards" [level=2] [ref=e225]
          - button "Add board" [ref=e226] [cursor=pointer]:
            - img [ref=e227]
        - generic [ref=e228]:
          - img [ref=e229]
          - textbox [ref=e232]:
            - /placeholder: Search boards...
      - generic [ref=e233]:
        - button "01 - General" [ref=e235] [cursor=pointer]:
          - img [ref=e236]
          - img [ref=e238]
          - generic [ref=e241]: 01 - General
        - button "02 - Architectural" [ref=e243] [cursor=pointer]:
          - img [ref=e244]
          - img [ref=e246]
          - generic [ref=e249]: 02 - Architectural
        - button "03 - Structural" [active] [ref=e251] [cursor=pointer]:
          - img [ref=e252]
          - img [ref=e254]
          - generic [ref=e257]: 03 - Structural
        - button "04 - MEP" [ref=e259] [cursor=pointer]:
          - img [ref=e260]
          - img [ref=e262]
          - generic [ref=e265]: 04 - MEP
        - button "05 - Site" [ref=e267] [cursor=pointer]:
          - img [ref=e268]
          - img [ref=e270]
          - generic [ref=e273]: 05 - Site
        - button "06 - Inspections" [ref=e275] [cursor=pointer]:
          - img [ref=e276]
          - img [ref=e278]
          - generic [ref=e281]: 06 - Inspections
        - generic [ref=e282]:
          - button "Photos & Documents" [ref=e283] [cursor=pointer]:
            - img [ref=e284]
            - img [ref=e286]
            - generic [ref=e289]: Photos & Documents
          - button "Site Photo Set" [ref=e290] [cursor=pointer]:
            - img [ref=e291]
            - generic [ref=e294]: Site Photo Set
      - generic [ref=e295]:
        - generic [ref=e296]:
          - generic [ref=e297]: Layers
          - img [ref=e298]
        - button "● Plan Grid" [ref=e300] [cursor=pointer]:
          - generic [ref=e301]:
            - generic [ref=e302]: ●
            - text: Plan Grid
        - button "● Structural - Beams" [ref=e303] [cursor=pointer]:
          - generic [ref=e304]:
            - generic [ref=e305]: ●
            - text: Structural - Beams
        - button "● Structural - Columns" [ref=e306] [cursor=pointer]:
          - generic [ref=e307]:
            - generic [ref=e308]: ●
            - text: Structural - Columns
        - button "● Dimensions" [ref=e309] [cursor=pointer]:
          - generic [ref=e310]:
            - generic [ref=e311]: ●
            - text: Dimensions
        - button "● Markups" [ref=e312] [cursor=pointer]:
          - generic [ref=e313]:
            - generic [ref=e314]: ●
            - text: Markups
          - img [ref=e315]
        - button "● Notes" [ref=e317] [cursor=pointer]:
          - generic [ref=e318]:
            - generic [ref=e319]: ●
            - text: Notes
        - button "● Photos" [ref=e320] [cursor=pointer]:
          - generic [ref=e321]:
            - generic [ref=e322]: ●
            - text: Photos
        - button "◌ Reference" [ref=e323] [cursor=pointer]:
          - generic [ref=e324]:
            - generic [ref=e325]: ◌
            - text: Reference
    - main [ref=e326]:
      - generic [ref=e327]:
        - generic [ref=e328]:
          - text: Level 2 Framing Plan
          - button "Reset active board" [ref=e329] [cursor=pointer]:
            - img [ref=e330]
        - button [ref=e333] [cursor=pointer]:
          - img [ref=e334]
      - generic [ref=e336]:
        - img [ref=e338]:
          - generic [ref=e343]: "1"
          - generic [ref=e346]: "2"
          - generic [ref=e349]: "3"
          - generic [ref=e352]: "4"
          - generic [ref=e355]: "5"
          - generic [ref=e358]: "6"
          - generic [ref=e361]: "7"
          - generic [ref=e364]: A
          - generic [ref=e367]: B
          - generic [ref=e370]: C
          - generic [ref=e373]: D
          - generic [ref=e404]:
            - generic [ref=e405]: B1 (W16x26)
            - generic [ref=e406]: B2 (W16x26)
            - generic [ref=e407]: B3 (W16x26)
            - generic [ref=e408]: B4 (W16x26)
            - generic [ref=e409]: B5 (W16x26)
            - generic [ref=e410]: B6 (W16x26)
            - generic [ref=e411]: B7 (W16x26)
            - generic [ref=e412]: B8 (W16x26)
            - generic [ref=e413]: B9 (W16x26)
            - generic [ref=e414]: B10 (W16x26)
            - generic [ref=e415]: B11 (W16x26)
            - generic [ref=e416]: B12 (W16x26)
            - generic [ref=e417]: B13 (W16x26)
            - generic [ref=e418]: B14 (W16x26)
            - generic [ref=e419]: B15 (W16x26)
            - generic [ref=e420]: B16 (W16x26)
            - generic [ref=e421]: B17 (W16x26)
            - generic [ref=e422]: B18 (W16x26)
            - generic [ref=e423]: B19 (W16x26)
            - generic [ref=e424]: B20 (W16x26)
            - generic [ref=e425]: B21 (W16x26)
            - generic [ref=e426]: B22 (W16x26)
            - generic [ref=e427]: B23 (W16x26)
            - generic [ref=e428]: B24 (W16x26)
          - generic [ref=e435]: P-3-2
          - generic [ref=e436]:
            - generic [ref=e437]: 24'-0"
            - generic [ref=e438]: 24'-0"
            - generic [ref=e439]: 24'-0"
            - generic [ref=e440]: 180'-0"
          - generic [ref=e441]:
            - generic [ref=e444]: "1"
            - generic [ref=e447]: CORROSION AT SEAT CONN
            - generic [ref=e448]: FIELD VERIFY.
          - generic [ref=e456]:
            - generic [ref=e459]: "2"
            - generic [ref=e462]: PAINT PEELING, RUST SC
            - generic [ref=e463]: FIELD VERIFY.
          - generic [ref=e464]:
            - generic [ref=e467]: "3"
            - generic [ref=e470]: SECTION LOSS AT MIDSPA
            - generic [ref=e471]: FIELD VERIFY.
          - generic [ref=e472]:
            - generic [ref=e475]: "4"
            - generic [ref=e478]: SURFACE RUST
            - generic [ref=e479]: FIELD VERIFY.
          - generic [ref=e480]:
            - generic [ref=e483]: "5"
            - generic [ref=e486]: NO VISIBLE DISTRESS
            - generic [ref=e487]: FIELD VERIFY.
        - generic:
          - button "Annotation 1" [ref=e488] [cursor=pointer]
          - button "Annotation 2" [ref=e489] [cursor=pointer]
          - button "Annotation 3" [ref=e490] [cursor=pointer]
          - button "Annotation 4" [ref=e491] [cursor=pointer]
          - button "Annotation 5" [ref=e492] [cursor=pointer]
      - generic [ref=e493]:
        - generic [ref=e494]:
          - generic [ref=e495]:
            - text: Items / Markup Schedule
            - img [ref=e496]
          - table [ref=e499]:
            - rowgroup [ref=e500]:
              - row "ID Type Item Name Location Status Condition Priority Discipline Due Date" [ref=e501]:
                - columnheader "ID" [ref=e502]
                - columnheader "Type" [ref=e503]
                - columnheader "Item Name" [ref=e504]
                - columnheader "Location" [ref=e505]
                - columnheader "Status" [ref=e506]
                - columnheader "Condition" [ref=e507]
                - columnheader "Priority" [ref=e508]
                - columnheader "Discipline" [ref=e509]
                - columnheader "Due Date" [ref=e510]
            - rowgroup [ref=e511]:
              - row "1 Beam B12 Grid 6 / A-B Field Verify Corrosion at seat connection High Structural May 26, 2025" [ref=e512] [cursor=pointer]:
                - cell "1" [ref=e513]: "1"
                - cell "Beam" [ref=e515]
                - cell "B12" [ref=e516]
                - cell "Grid 6 / A-B" [ref=e517]
                - cell "Field Verify" [ref=e518]
                - cell "Corrosion at seat connection" [ref=e519]
                - cell "High" [ref=e520]
                - cell "Structural" [ref=e521]
                - cell "May 26, 2025" [ref=e522]
              - row "2 Beam B18 Grid 6 / B-C Field Verify Paint peeling, rust scale Medium Structural May 26, 2025" [ref=e523] [cursor=pointer]:
                - cell "2" [ref=e524]: "2"
                - cell "Beam" [ref=e526]
                - cell "B18" [ref=e527]
                - cell "Grid 6 / B-C" [ref=e528]
                - cell "Field Verify" [ref=e529]
                - cell "Paint peeling, rust scale" [ref=e530]
                - cell "Medium" [ref=e531]
                - cell "Structural" [ref=e532]
                - cell "May 26, 2025" [ref=e533]
              - row "3 Beam B31 Grid 5 / C-D Field Verify Section loss at midspan High Structural May 26, 2025" [ref=e534] [cursor=pointer]:
                - cell "3" [ref=e535]: "3"
                - cell "Beam" [ref=e537]
                - cell "B31" [ref=e538]
                - cell "Grid 5 / C-D" [ref=e539]
                - cell "Field Verify" [ref=e540]
                - cell "Section loss at midspan" [ref=e541]
                - cell "High" [ref=e542]
                - cell "Structural" [ref=e543]
                - cell "May 26, 2025" [ref=e544]
              - row "4 Column C16 Grid 5 / B-C Monitor Surface rust Low Structural Jun 10, 2025" [ref=e545] [cursor=pointer]:
                - cell "4" [ref=e546]: "4"
                - cell "Column" [ref=e548]
                - cell "C16" [ref=e549]
                - cell "Grid 5 / B-C" [ref=e550]
                - cell "Monitor" [ref=e551]
                - cell "Surface rust" [ref=e552]
                - cell "Low" [ref=e553]
                - cell "Structural" [ref=e554]
                - cell "Jun 10, 2025" [ref=e555]
              - row "5 Beam B7 Grid 2 / A-B Complete No visible distress Low Structural —" [ref=e556] [cursor=pointer]:
                - cell "5" [ref=e557]: "5"
                - cell "Beam" [ref=e559]
                - cell "B7" [ref=e560]
                - cell "Grid 2 / A-B" [ref=e561]
                - cell "Complete" [ref=e562]
                - cell "No visible distress" [ref=e563]
                - cell "Low" [ref=e564]
                - cell "Structural" [ref=e565]
                - cell "—" [ref=e566]
          - generic [ref=e567]: 1–5 of 5 items
        - generic [ref=e568]:
          - generic [ref=e569]:
            - text: Relationship Map / Blueprint
            - generic [ref=e570]: Click nodes to inspect links
          - generic [ref=e571]:
            - img [ref=e572]:
              - generic [ref=e577]: refers to
              - generic [ref=e581]: has
              - generic [ref=e585]: impacts
              - generic [ref=e589]: relates
              - generic [ref=e593]: referenced by
            - 'button "Plan Marker #1 Location" [ref=e594] [cursor=pointer]':
              - generic [ref=e595]: "Plan Marker #1"
              - generic [ref=e596]: Location
            - button "1 Beam B12 Project Item" [ref=e597] [cursor=pointer]:
              - generic [ref=e598]: "1"
              - generic [ref=e599]: Beam B12
              - generic [ref=e600]: Project Item
            - button "Site Photos (3) Photo Set" [ref=e601] [cursor=pointer]:
              - generic [ref=e602]: Site Photos (3)
              - generic [ref=e603]: Photo Set
            - button "Board Markups (1) Board Annotations" [ref=e604] [cursor=pointer]:
              - generic [ref=e605]: Board Markups (1)
              - generic [ref=e606]: Board Annotations
            - button "Cost Item C-102 Cost" [ref=e607] [cursor=pointer]:
              - generic [ref=e608]: Cost Item C-102
              - generic [ref=e609]: Cost
            - button "Document S-2.3 Document" [ref=e610] [cursor=pointer]:
              - generic [ref=e611]: Document S-2.3
              - generic [ref=e612]: Document
            - generic [ref=e613]:
              - generic [ref=e614]: Selected Blueprint Node
              - generic [ref=e615]: Beam B12
              - generic [ref=e616]: Project Item
              - generic [ref=e617]:
                - generic [ref=e618]:
                  - generic [ref=e619]: Links
                  - generic [ref=e620]: "4"
                - generic [ref=e621]:
                  - generic [ref=e622]: Count
                  - generic [ref=e623]: "1"
              - generic [ref=e624]:
                - generic [ref=e625]: Details
                - generic [ref=e626]: W16x26
            - generic [ref=e627]:
              - button "−" [ref=e628] [cursor=pointer]
              - generic [ref=e629]: 100%
              - button "+" [ref=e630] [cursor=pointer]
              - button [ref=e631] [cursor=pointer]:
                - img [ref=e632]
    - complementary [ref=e637]:
      - generic [ref=e638]:
        - heading "Site Photos" [level=2] [ref=e639]
        - generic [ref=e640]:
          - button "Filter linked photos" [ref=e641] [cursor=pointer]:
            - img [ref=e642]
          - button "Collapse photos panel" [ref=e644] [cursor=pointer]:
            - img [ref=e645]
      - generic [ref=e648]:
        - button "1 P101_0456.JPG May 11, 2025 Grid 6 / A-B" [ref=e649] [cursor=pointer]:
          - generic [ref=e650]:
            - img [ref=e651]
            - generic [ref=e668]: "1"
          - generic [ref=e669]:
            - generic [ref=e670]:
              - generic [ref=e671]: P101_0456.JPG
              - generic [ref=e672]: May 11, 2025
            - generic [ref=e673]: Grid 6 / A-B
        - button "2 P101_0461.JPG May 11, 2025 Grid 6 / B-C" [ref=e674] [cursor=pointer]:
          - generic [ref=e675]:
            - img [ref=e676]
            - generic [ref=e693]: "2"
          - generic [ref=e694]:
            - generic [ref=e695]:
              - generic [ref=e696]: P101_0461.JPG
              - generic [ref=e697]: May 11, 2025
            - generic [ref=e698]: Grid 6 / B-C
        - button "3 P101_0468.JPG May 11, 2025 Grid 5 / C-D" [ref=e699] [cursor=pointer]:
          - generic [ref=e700]:
            - img [ref=e701]
            - generic [ref=e718]: "3"
          - generic [ref=e719]:
            - generic [ref=e720]:
              - generic [ref=e721]: P101_0468.JPG
              - generic [ref=e722]: May 11, 2025
            - generic [ref=e723]: Grid 5 / C-D
        - button "View all photos (5)" [ref=e724] [cursor=pointer]
    - complementary [ref=e725]:
      - generic [ref=e726]:
        - heading "Inspector" [level=2] [ref=e727]
        - button [ref=e728] [cursor=pointer]:
          - img [ref=e729]
      - generic [ref=e732]:
        - generic [ref=e733]:
          - generic [ref=e734]:
            - generic [ref=e735]:
              - generic [ref=e736]: "1"
              - heading "Beam B12" [level=2] [ref=e738]
            - button "Field Verify" [ref=e739] [cursor=pointer]:
              - text: Field Verify
              - img [ref=e740]
          - generic [ref=e742]:
            - generic [ref=e743]:
              - generic [ref=e744]: Item Name
              - generic [ref=e745]: Beam B12
            - generic [ref=e746]:
              - generic [ref=e747]: Type
              - generic [ref=e748]: Steel Beam
            - generic [ref=e749]:
              - generic [ref=e750]: Status
              - button "Field Verify" [ref=e752] [cursor=pointer]
            - generic [ref=e753]:
              - generic [ref=e754]: Section
              - generic [ref=e755]: W16x26
            - generic [ref=e756]:
              - generic [ref=e757]: Location
              - generic [ref=e758]: Grid 6 / A-B
            - generic [ref=e759]:
              - generic [ref=e760]: Elevation
              - generic [ref=e761]: +14&apos;-0&quot; (T.O.S.)
            - generic [ref=e762]:
              - generic [ref=e763]: Condition
              - button "Corrosion at seat connection" [ref=e765] [cursor=pointer]
            - generic [ref=e766]:
              - generic [ref=e767]: Priority
              - button "High" [ref=e769] [cursor=pointer]
            - generic [ref=e770]:
              - generic [ref=e771]: Discipline
              - generic [ref=e772]: Structural
            - generic [ref=e773]:
              - generic [ref=e774]: Created By
              - generic [ref=e775]: A. Morgan
            - generic [ref=e776]:
              - generic [ref=e777]: Date
              - generic [ref=e778]: May 12, 2025
        - generic [ref=e779]:
          - button "Linked Photos 3" [ref=e780] [cursor=pointer]:
            - generic [ref=e781]:
              - img [ref=e782]
              - text: Linked Photos
            - generic [ref=e785]:
              - text: "3"
              - img [ref=e786]
          - button "Linked Documents 2" [ref=e788] [cursor=pointer]:
            - generic [ref=e789]:
              - img [ref=e790]
              - text: Linked Documents
            - generic [ref=e793]:
              - text: "2"
              - img [ref=e794]
          - button "Board Markups 1" [ref=e796] [cursor=pointer]:
            - generic [ref=e797]:
              - img [ref=e798]
              - text: Board Markups
            - generic [ref=e801]:
              - text: "1"
              - img [ref=e802]
          - button "Linked Costs 1" [ref=e804] [cursor=pointer]:
            - generic [ref=e805]:
              - img [ref=e806]
              - text: Linked Costs
            - generic [ref=e809]:
              - text: "1"
              - img [ref=e810]
        - generic [ref=e812]:
          - generic [ref=e813]:
            - heading "Linked Photos (3)" [level=3] [ref=e814]
            - button [ref=e815] [cursor=pointer]:
              - img [ref=e816]
          - generic [ref=e817]:
            - generic [ref=e818]:
              - img [ref=e820]
              - generic [ref=e837]:
                - generic [ref=e838]: P101_0456.JPG
                - generic [ref=e839]: May 11, 2025
                - generic [ref=e840]: Grid 6 / A-B
            - generic [ref=e841]:
              - img [ref=e843]
              - generic [ref=e860]:
                - generic [ref=e861]: P101_0457.JPG
                - generic [ref=e862]: May 11, 2025
                - generic [ref=e863]: Grid 6 / A-B
        - generic [ref=e864]:
          - generic [ref=e865]:
            - heading "Notes" [level=3] [ref=e866]
            - button "Edit note" [ref=e867] [cursor=pointer]:
              - img [ref=e868]
          - button "Seat angle connection shows heavy rust and section loss. Verify seat and bearing stiffener condition." [ref=e870] [cursor=pointer]
          - generic [ref=e871]: A. Morgan, May 12, 2025 9:15 AM
        - generic [ref=e872]:
          - generic [ref=e873]:
            - heading "Comments (1)" [level=3] [ref=e874]
            - img [ref=e875]
          - generic [ref=e878]:
            - generic [ref=e879]:
              - generic [ref=e880]: A. Morgan
              - button "Open" [ref=e881] [cursor=pointer]
            - paragraph [ref=e882]: Verify seat angle thickness and bearing stiffener condition during follow-up visit.
            - generic [ref=e883]: May 12, 2025 9:15 AM
          - textbox "Add engineering note or reply..." [ref=e884]
          - button "Add Comment" [ref=e885] [cursor=pointer]
        - generic [ref=e886]:
          - generic [ref=e887]:
            - heading "Issue Details" [level=3] [ref=e888]
            - img [ref=e889]
          - generic [ref=e891]:
            - generic [ref=e892]:
              - generic [ref=e893]: Issue Type
              - generic [ref=e894]: Corrosion
            - generic [ref=e895]:
              - generic [ref=e896]: Severity
              - generic [ref=e897]: Severe
            - generic [ref=e898]:
              - generic [ref=e899]: Recommendation
              - generic [ref=e900]: Repair
            - generic [ref=e901]:
              - generic [ref=e902]: Recommended Action
              - generic [ref=e903]: Grind, repair, prime and repaint
            - generic [ref=e904]:
              - generic [ref=e905]: Due Date
              - generic [ref=e906]: May 26, 2025
  - contentinfo [ref=e907]:
    - generic [ref=e908]: Select active. Click a markup to select it and show properties. Use Eraser to delete, Pan to move the view, Esc cancels active tools.
    - generic [ref=e909]: "X: 152'-3 1/2\" Y: 47'-6 3/4\" | Plan: 100% / Map: 100% | Grid: 1'-0\" ● Online"
```

# Test source

```ts
  1   | import { expect, test, type Locator, type Page } from '@playwright/test';
  2   | 
  3   | async function openWorkspace(page: Page) {
  4   |   await page.goto('/qa/visual-workspace');
  5   |   await page.evaluate(() => window.localStorage.clear());
  6   |   await page.reload();
  7   |   await expect(page.getByTestId('plan-canvas')).toBeVisible();
  8   | }
  9   | 
  10  | async function annotationCount(page: Page) {
  11  |   return page.locator('[data-testid^="annotation-"][data-tool-type]').count();
  12  | }
  13  | 
  14  | async function canvasBox(page: Page) {
  15  |   const canvas = page.getByTestId('plan-canvas');
  16  |   const box = await canvas.boundingBox();
  17  |   if (!box) throw new Error('plan canvas not visible');
  18  |   return { canvas, box };
  19  | }
  20  | 
  21  | async function dispatchPointerOnCanvas(page: Page, type: string, x: number, y: number) {
  22  |   const { canvas, box } = await canvasBox(page);
  23  |   await canvas.dispatchEvent(type, {
  24  |     bubbles: true,
  25  |     cancelable: true,
  26  |     clientX: box.x + x,
  27  |     clientY: box.y + y,
  28  |     pointerId: 1,
  29  |     pointerType: 'mouse',
  30  |     isPrimary: true,
  31  |     buttons: type === 'pointerup' ? 0 : 1,
  32  |     button: 0,
  33  |   });
  34  | }
  35  | 
  36  | async function dragOnCanvas(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  37  |   await dispatchPointerOnCanvas(page, 'pointerdown', start.x, start.y);
  38  |   for (let i = 1; i <= 8; i += 1) {
  39  |     const x = start.x + ((end.x - start.x) * i) / 8;
  40  |     const y = start.y + ((end.y - start.y) * i) / 8;
  41  |     await dispatchPointerOnCanvas(page, 'pointermove', x, y);
  42  |   }
  43  |   await dispatchPointerOnCanvas(page, 'pointerup', end.x, end.y);
  44  |   await page.waitForTimeout(250);
  45  | }
  46  | 
  47  | async function wheelCanvas(page: Page, deltaY: number) {
  48  |   const { canvas, box } = await canvasBox(page);
  49  |   await canvas.dispatchEvent('wheel', {
  50  |     bubbles: true,
  51  |     cancelable: true,
  52  |     clientX: box.x + 450,
  53  |     clientY: box.y + 250,
  54  |     deltaY,
  55  |   });
  56  |   await page.waitForTimeout(150);
  57  | }
  58  | 
  59  | async function clickAnnotation(page: Page, id: number) {
  60  |   const hit = page.getByTestId(`annotation-hit-${id}`);
  61  |   if (await hit.count()) {
  62  |     await hit.click({ force: true });
  63  |     return;
  64  |   }
  65  |   await page.getByTestId(`annotation-${id}`).click({ force: true });
  66  | }
  67  | 
  68  | async function annotationLocator(page: Page, id: number) {
  69  |   const hit = page.getByTestId(`annotation-hit-${id}`);
  70  |   if (await hit.count()) return hit;
  71  |   return page.getByTestId(`annotation-${id}`);
  72  | }
  73  | 
  74  | async function getBox(locator: Locator) {
  75  |   const box = await locator.boundingBox();
  76  |   if (!box) throw new Error('element has no bounding box');
  77  |   return box;
  78  | }
  79  | 
  80  | async function expectNoPageErrors(page: Page, action: () => Promise<void>) {
  81  |   const errors: string[] = [];
  82  |   page.on('pageerror', (error) => errors.push(error.message));
  83  |   await action();
  84  |   await page.waitForTimeout(150);
  85  |   expect(errors).toEqual([]);
> 86  |   await expect(page.locator('body')).toBeVisible();
      |                                      ^ Error: expect(locator).toBeVisible() failed
  87  | }
  88  | 
  89  | test.describe('Visual Workspace toolbar behavior', () => {
  90  |   test.beforeEach(async ({ page }) => {
  91  |     await openWorkspace(page);
  92  |   });
  93  | 
  94  |   test('Select only selects an annotation and does not move it on click', async ({ page }) => {
  95  |     await page.getByTestId('tool-select').click();
  96  | 
  97  |     const annotation = await annotationLocator(page, 1);
  98  |     const before = await getBox(annotation);
  99  | 
  100 |     await clickAnnotation(page, 1);
  101 |     await expect(page.getByTestId('inspector-title')).toContainText(/B12|N1|Text|Beam/);
  102 | 
  103 |     const after = await getBox(annotation);
  104 |     expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  105 |     expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  106 |   });
  107 | 
  108 |   test('Cloud tool creates a new annotation from a drag', async ({ page }) => {
  109 |     const before = await annotationCount(page);
  110 | 
  111 |     await page.getByTestId('tool-cloud').click();
  112 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Cloud');
  113 | 
  114 |     await dragOnCanvas(page, { x: 360, y: 180 }, { x: 560, y: 260 });
  115 | 
  116 |     await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
  117 |     await expect(page.getByTestId('inspector-title')).toBeVisible();
  118 |   });
  119 | 
  120 |   test('Text tool creates actual text annotation', async ({ page }) => {
  121 |     const before = await annotationCount(page);
  122 | 
  123 |     await page.getByTestId('tool-text').click();
  124 |     await dragOnCanvas(page, { x: 420, y: 210 }, { x: 620, y: 260 });
  125 | 
  126 |     await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
  127 |     await expect(page.getByTestId('inspector-title')).toContainText(/Text N\d+/);
  128 |     await expect(page.getByText('TEXT NOTE').first()).toBeVisible();
  129 |   });
  130 | 
  131 |   test('Eraser is a mode and erases the clicked annotation only', async ({ page }) => {
  132 |     const before = await annotationCount(page);
  133 | 
  134 |     await page.getByTestId('tool-eraser').click();
  135 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
  136 | 
  137 |     await clickAnnotation(page, 1);
  138 | 
  139 |     await expect.poll(() => annotationCount(page)).toBe(before - 1);
  140 |     await expect(page.getByTestId('plan-canvas')).toBeVisible();
  141 |   });
  142 | 
  143 |   test('Escape cancels active tool back to Select', async ({ page }) => {
  144 |     await page.getByTestId('tool-eraser').click();
  145 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
  146 | 
  147 |     await page.keyboard.press('Escape');
  148 | 
  149 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  150 |   });
  151 | 
  152 |   test('Pan moves the view and Fit resets it', async ({ page }) => {
  153 |     const transform = page.getByTestId('plan-transform');
  154 | 
  155 |     await page.getByTestId('tool-pan').click();
  156 |     await dragOnCanvas(page, { x: 360, y: 240 }, { x: 440, y: 300 });
  157 | 
  158 |     await expect(transform).not.toHaveAttribute('data-plan-pan-x', '0');
  159 | 
  160 |     await page.getByTestId('tool-fit').click();
  161 | 
  162 |     await expect(transform).toHaveAttribute('data-plan-zoom', '1');
  163 |     await expect(transform).toHaveAttribute('data-plan-pan-x', '0');
  164 |     await expect(transform).toHaveAttribute('data-plan-pan-y', '0');
  165 |   });
  166 | 
  167 |   test('Zoom mode uses wheel and Escape cancels', async ({ page }) => {
  168 |     const transform = page.getByTestId('plan-transform');
  169 |     await expect(transform).toHaveAttribute('data-plan-zoom', '1');
  170 | 
  171 |     await page.getByTestId('tool-zoom').click();
  172 |     await wheelCanvas(page, -400);
  173 |     await wheelCanvas(page, -400);
  174 | 
  175 |     await expect(transform).not.toHaveAttribute('data-plan-zoom', '1');
  176 | 
  177 |     await page.keyboard.press('Escape');
  178 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  179 |   });
  180 | 
  181 |   test('Color opens palette and changes selected annotation color', async ({ page }) => {
  182 |     await page.getByTestId('tool-select').click();
  183 |     await clickAnnotation(page, 1);
  184 | 
  185 |     await page.getByTestId('tool-color').click();
  186 |     await expect(page.getByTestId('active-panel-title')).toContainText('Choose markup color');
```