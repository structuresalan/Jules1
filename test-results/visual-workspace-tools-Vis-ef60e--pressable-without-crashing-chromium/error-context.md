# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-workspace-tools.spec.ts >> Visual Workspace pressable control coverage >> toolbar button Select is pressable without crashing
- Location: tests\visual-workspace-tools.spec.ts:283:5

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
    8 × locator resolved to <body data-website-accent="blue" data-website-style="desktop-glass" data-website-density="comfortable">…</body>
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
          - button "Select" [active] [ref=e41] [cursor=pointer]:
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
        - generic [ref=e250]:
          - button "03 - Structural" [ref=e251] [cursor=pointer]:
            - img [ref=e252]
            - img [ref=e254]
            - generic [ref=e257]: 03 - Structural
          - button "Level 2 Framing Plan" [ref=e258] [cursor=pointer]:
            - img [ref=e259]
            - generic [ref=e262]: Level 2 Framing Plan
          - button "Roof Framing Plan" [ref=e264] [cursor=pointer]:
            - img [ref=e265]
            - generic [ref=e268]: Roof Framing Plan
          - button "South Elevation" [ref=e269] [cursor=pointer]:
            - img [ref=e270]
            - generic [ref=e273]: South Elevation
          - button "East Elevation" [ref=e274] [cursor=pointer]:
            - img [ref=e275]
            - generic [ref=e278]: East Elevation
          - button "Typical Sections" [ref=e279] [cursor=pointer]:
            - img [ref=e280]
            - generic [ref=e283]: Typical Sections
        - button "04 - MEP" [ref=e285] [cursor=pointer]:
          - img [ref=e286]
          - img [ref=e288]
          - generic [ref=e291]: 04 - MEP
        - button "05 - Site" [ref=e293] [cursor=pointer]:
          - img [ref=e294]
          - img [ref=e296]
          - generic [ref=e299]: 05 - Site
        - button "06 - Inspections" [ref=e301] [cursor=pointer]:
          - img [ref=e302]
          - img [ref=e304]
          - generic [ref=e307]: 06 - Inspections
        - generic [ref=e308]:
          - button "Photos & Documents" [ref=e309] [cursor=pointer]:
            - img [ref=e310]
            - img [ref=e312]
            - generic [ref=e315]: Photos & Documents
          - button "Site Photo Set" [ref=e316] [cursor=pointer]:
            - img [ref=e317]
            - generic [ref=e320]: Site Photo Set
      - generic [ref=e321]:
        - generic [ref=e322]:
          - generic [ref=e323]: Layers
          - img [ref=e324]
        - button "● Plan Grid" [ref=e326] [cursor=pointer]:
          - generic [ref=e327]:
            - generic [ref=e328]: ●
            - text: Plan Grid
        - button "● Structural - Beams" [ref=e329] [cursor=pointer]:
          - generic [ref=e330]:
            - generic [ref=e331]: ●
            - text: Structural - Beams
        - button "● Structural - Columns" [ref=e332] [cursor=pointer]:
          - generic [ref=e333]:
            - generic [ref=e334]: ●
            - text: Structural - Columns
        - button "● Dimensions" [ref=e335] [cursor=pointer]:
          - generic [ref=e336]:
            - generic [ref=e337]: ●
            - text: Dimensions
        - button "● Markups" [ref=e338] [cursor=pointer]:
          - generic [ref=e339]:
            - generic [ref=e340]: ●
            - text: Markups
          - img [ref=e341]
        - button "● Notes" [ref=e343] [cursor=pointer]:
          - generic [ref=e344]:
            - generic [ref=e345]: ●
            - text: Notes
        - button "● Photos" [ref=e346] [cursor=pointer]:
          - generic [ref=e347]:
            - generic [ref=e348]: ●
            - text: Photos
        - button "◌ Reference" [ref=e349] [cursor=pointer]:
          - generic [ref=e350]:
            - generic [ref=e351]: ◌
            - text: Reference
    - main [ref=e352]:
      - generic [ref=e353]:
        - generic [ref=e354]:
          - text: Level 2 Framing Plan
          - button "Reset active board" [ref=e355] [cursor=pointer]:
            - img [ref=e356]
        - button [ref=e359] [cursor=pointer]:
          - img [ref=e360]
      - generic [ref=e362]:
        - img [ref=e364]:
          - generic [ref=e369]: "1"
          - generic [ref=e372]: "2"
          - generic [ref=e375]: "3"
          - generic [ref=e378]: "4"
          - generic [ref=e381]: "5"
          - generic [ref=e384]: "6"
          - generic [ref=e387]: "7"
          - generic [ref=e390]: A
          - generic [ref=e393]: B
          - generic [ref=e396]: C
          - generic [ref=e399]: D
          - generic [ref=e430]:
            - generic [ref=e431]: B1 (W16x26)
            - generic [ref=e432]: B2 (W16x26)
            - generic [ref=e433]: B3 (W16x26)
            - generic [ref=e434]: B4 (W16x26)
            - generic [ref=e435]: B5 (W16x26)
            - generic [ref=e436]: B6 (W16x26)
            - generic [ref=e437]: B7 (W16x26)
            - generic [ref=e438]: B8 (W16x26)
            - generic [ref=e439]: B9 (W16x26)
            - generic [ref=e440]: B10 (W16x26)
            - generic [ref=e441]: B11 (W16x26)
            - generic [ref=e442]: B12 (W16x26)
            - generic [ref=e443]: B13 (W16x26)
            - generic [ref=e444]: B14 (W16x26)
            - generic [ref=e445]: B15 (W16x26)
            - generic [ref=e446]: B16 (W16x26)
            - generic [ref=e447]: B17 (W16x26)
            - generic [ref=e448]: B18 (W16x26)
            - generic [ref=e449]: B19 (W16x26)
            - generic [ref=e450]: B20 (W16x26)
            - generic [ref=e451]: B21 (W16x26)
            - generic [ref=e452]: B22 (W16x26)
            - generic [ref=e453]: B23 (W16x26)
            - generic [ref=e454]: B24 (W16x26)
          - generic [ref=e461]: P-3-2
          - generic [ref=e462]:
            - generic [ref=e463]: 24'-0"
            - generic [ref=e464]: 24'-0"
            - generic [ref=e465]: 24'-0"
            - generic [ref=e466]: 180'-0"
          - generic [ref=e467]:
            - generic [ref=e470]: "1"
            - generic [ref=e473]: CORROSION AT SEAT CONN
            - generic [ref=e474]: FIELD VERIFY.
          - generic [ref=e482]:
            - generic [ref=e485]: "2"
            - generic [ref=e488]: PAINT PEELING, RUST SC
            - generic [ref=e489]: FIELD VERIFY.
          - generic [ref=e490]:
            - generic [ref=e493]: "3"
            - generic [ref=e496]: SECTION LOSS AT MIDSPA
            - generic [ref=e497]: FIELD VERIFY.
          - generic [ref=e498]:
            - generic [ref=e501]: "4"
            - generic [ref=e504]: SURFACE RUST
            - generic [ref=e505]: FIELD VERIFY.
          - generic [ref=e506]:
            - generic [ref=e509]: "5"
            - generic [ref=e512]: NO VISIBLE DISTRESS
            - generic [ref=e513]: FIELD VERIFY.
        - generic:
          - button "Annotation 1" [ref=e514] [cursor=pointer]
          - button "Annotation 2" [ref=e515] [cursor=pointer]
          - button "Annotation 3" [ref=e516] [cursor=pointer]
          - button "Annotation 4" [ref=e517] [cursor=pointer]
          - button "Annotation 5" [ref=e518] [cursor=pointer]
      - generic [ref=e519]:
        - generic [ref=e520]:
          - generic [ref=e521]:
            - text: Items / Markup Schedule
            - img [ref=e522]
          - table [ref=e525]:
            - rowgroup [ref=e526]:
              - row "ID Type Item Name Location Status Condition Priority Discipline Due Date" [ref=e527]:
                - columnheader "ID" [ref=e528]
                - columnheader "Type" [ref=e529]
                - columnheader "Item Name" [ref=e530]
                - columnheader "Location" [ref=e531]
                - columnheader "Status" [ref=e532]
                - columnheader "Condition" [ref=e533]
                - columnheader "Priority" [ref=e534]
                - columnheader "Discipline" [ref=e535]
                - columnheader "Due Date" [ref=e536]
            - rowgroup [ref=e537]:
              - row "1 Beam B12 Grid 6 / A-B Field Verify Corrosion at seat connection High Structural May 26, 2025" [ref=e538] [cursor=pointer]:
                - cell "1" [ref=e539]: "1"
                - cell "Beam" [ref=e541]
                - cell "B12" [ref=e542]
                - cell "Grid 6 / A-B" [ref=e543]
                - cell "Field Verify" [ref=e544]
                - cell "Corrosion at seat connection" [ref=e545]
                - cell "High" [ref=e546]
                - cell "Structural" [ref=e547]
                - cell "May 26, 2025" [ref=e548]
              - row "2 Beam B18 Grid 6 / B-C Field Verify Paint peeling, rust scale Medium Structural May 26, 2025" [ref=e549] [cursor=pointer]:
                - cell "2" [ref=e550]: "2"
                - cell "Beam" [ref=e552]
                - cell "B18" [ref=e553]
                - cell "Grid 6 / B-C" [ref=e554]
                - cell "Field Verify" [ref=e555]
                - cell "Paint peeling, rust scale" [ref=e556]
                - cell "Medium" [ref=e557]
                - cell "Structural" [ref=e558]
                - cell "May 26, 2025" [ref=e559]
              - row "3 Beam B31 Grid 5 / C-D Field Verify Section loss at midspan High Structural May 26, 2025" [ref=e560] [cursor=pointer]:
                - cell "3" [ref=e561]: "3"
                - cell "Beam" [ref=e563]
                - cell "B31" [ref=e564]
                - cell "Grid 5 / C-D" [ref=e565]
                - cell "Field Verify" [ref=e566]
                - cell "Section loss at midspan" [ref=e567]
                - cell "High" [ref=e568]
                - cell "Structural" [ref=e569]
                - cell "May 26, 2025" [ref=e570]
              - row "4 Column C16 Grid 5 / B-C Monitor Surface rust Low Structural Jun 10, 2025" [ref=e571] [cursor=pointer]:
                - cell "4" [ref=e572]: "4"
                - cell "Column" [ref=e574]
                - cell "C16" [ref=e575]
                - cell "Grid 5 / B-C" [ref=e576]
                - cell "Monitor" [ref=e577]
                - cell "Surface rust" [ref=e578]
                - cell "Low" [ref=e579]
                - cell "Structural" [ref=e580]
                - cell "Jun 10, 2025" [ref=e581]
              - row "5 Beam B7 Grid 2 / A-B Complete No visible distress Low Structural —" [ref=e582] [cursor=pointer]:
                - cell "5" [ref=e583]: "5"
                - cell "Beam" [ref=e585]
                - cell "B7" [ref=e586]
                - cell "Grid 2 / A-B" [ref=e587]
                - cell "Complete" [ref=e588]
                - cell "No visible distress" [ref=e589]
                - cell "Low" [ref=e590]
                - cell "Structural" [ref=e591]
                - cell "—" [ref=e592]
          - generic [ref=e593]: 1–5 of 5 items
        - generic [ref=e594]:
          - generic [ref=e595]:
            - text: Relationship Map / Blueprint
            - generic [ref=e596]: Click nodes to inspect links
          - generic [ref=e597]:
            - img [ref=e598]:
              - generic [ref=e603]: refers to
              - generic [ref=e607]: has
              - generic [ref=e611]: impacts
              - generic [ref=e615]: relates
              - generic [ref=e619]: referenced by
            - 'button "Plan Marker #1 Location" [ref=e620] [cursor=pointer]':
              - generic [ref=e621]: "Plan Marker #1"
              - generic [ref=e622]: Location
            - button "1 Beam B12 Project Item" [ref=e623] [cursor=pointer]:
              - generic [ref=e624]: "1"
              - generic [ref=e625]: Beam B12
              - generic [ref=e626]: Project Item
            - button "Site Photos (3) Photo Set" [ref=e627] [cursor=pointer]:
              - generic [ref=e628]: Site Photos (3)
              - generic [ref=e629]: Photo Set
            - button "Board Markups (1) Board Annotations" [ref=e630] [cursor=pointer]:
              - generic [ref=e631]: Board Markups (1)
              - generic [ref=e632]: Board Annotations
            - button "Cost Item C-102 Cost" [ref=e633] [cursor=pointer]:
              - generic [ref=e634]: Cost Item C-102
              - generic [ref=e635]: Cost
            - button "Document S-2.3 Document" [ref=e636] [cursor=pointer]:
              - generic [ref=e637]: Document S-2.3
              - generic [ref=e638]: Document
            - generic [ref=e639]:
              - generic [ref=e640]: Selected Blueprint Node
              - generic [ref=e641]: Beam B12
              - generic [ref=e642]: Project Item
              - generic [ref=e643]:
                - generic [ref=e644]:
                  - generic [ref=e645]: Links
                  - generic [ref=e646]: "4"
                - generic [ref=e647]:
                  - generic [ref=e648]: Count
                  - generic [ref=e649]: "1"
              - generic [ref=e650]:
                - generic [ref=e651]: Details
                - generic [ref=e652]: W16x26
            - generic [ref=e653]:
              - button "−" [ref=e654] [cursor=pointer]
              - generic [ref=e655]: 100%
              - button "+" [ref=e656] [cursor=pointer]
              - button [ref=e657] [cursor=pointer]:
                - img [ref=e658]
    - complementary [ref=e663]:
      - generic [ref=e664]:
        - heading "Site Photos" [level=2] [ref=e665]
        - generic [ref=e666]:
          - button "Filter linked photos" [ref=e667] [cursor=pointer]:
            - img [ref=e668]
          - button "Collapse photos panel" [ref=e670] [cursor=pointer]:
            - img [ref=e671]
      - generic [ref=e674]:
        - button "1 P101_0456.JPG May 11, 2025 Grid 6 / A-B" [ref=e675] [cursor=pointer]:
          - generic [ref=e676]:
            - img [ref=e677]
            - generic [ref=e694]: "1"
          - generic [ref=e695]:
            - generic [ref=e696]:
              - generic [ref=e697]: P101_0456.JPG
              - generic [ref=e698]: May 11, 2025
            - generic [ref=e699]: Grid 6 / A-B
        - button "2 P101_0461.JPG May 11, 2025 Grid 6 / B-C" [ref=e700] [cursor=pointer]:
          - generic [ref=e701]:
            - img [ref=e702]
            - generic [ref=e719]: "2"
          - generic [ref=e720]:
            - generic [ref=e721]:
              - generic [ref=e722]: P101_0461.JPG
              - generic [ref=e723]: May 11, 2025
            - generic [ref=e724]: Grid 6 / B-C
        - button "3 P101_0468.JPG May 11, 2025 Grid 5 / C-D" [ref=e725] [cursor=pointer]:
          - generic [ref=e726]:
            - img [ref=e727]
            - generic [ref=e744]: "3"
          - generic [ref=e745]:
            - generic [ref=e746]:
              - generic [ref=e747]: P101_0468.JPG
              - generic [ref=e748]: May 11, 2025
            - generic [ref=e749]: Grid 5 / C-D
        - button "View all photos (5)" [ref=e750] [cursor=pointer]
    - complementary [ref=e751]:
      - generic [ref=e752]:
        - heading "Inspector" [level=2] [ref=e753]
        - button [ref=e754] [cursor=pointer]:
          - img [ref=e755]
      - generic [ref=e758]:
        - generic [ref=e759]:
          - generic [ref=e760]:
            - generic [ref=e761]:
              - generic [ref=e762]: "1"
              - heading "Beam B12" [level=2] [ref=e764]
            - button "Field Verify" [ref=e765] [cursor=pointer]:
              - text: Field Verify
              - img [ref=e766]
          - generic [ref=e768]:
            - generic [ref=e769]:
              - generic [ref=e770]: Item Name
              - generic [ref=e771]: Beam B12
            - generic [ref=e772]:
              - generic [ref=e773]: Type
              - generic [ref=e774]: Steel Beam
            - generic [ref=e775]:
              - generic [ref=e776]: Status
              - button "Field Verify" [ref=e778] [cursor=pointer]
            - generic [ref=e779]:
              - generic [ref=e780]: Section
              - generic [ref=e781]: W16x26
            - generic [ref=e782]:
              - generic [ref=e783]: Location
              - generic [ref=e784]: Grid 6 / A-B
            - generic [ref=e785]:
              - generic [ref=e786]: Elevation
              - generic [ref=e787]: +14&apos;-0&quot; (T.O.S.)
            - generic [ref=e788]:
              - generic [ref=e789]: Condition
              - button "Corrosion at seat connection" [ref=e791] [cursor=pointer]
            - generic [ref=e792]:
              - generic [ref=e793]: Priority
              - button "High" [ref=e795] [cursor=pointer]
            - generic [ref=e796]:
              - generic [ref=e797]: Discipline
              - generic [ref=e798]: Structural
            - generic [ref=e799]:
              - generic [ref=e800]: Created By
              - generic [ref=e801]: A. Morgan
            - generic [ref=e802]:
              - generic [ref=e803]: Date
              - generic [ref=e804]: May 12, 2025
        - generic [ref=e805]:
          - button "Linked Photos 3" [ref=e806] [cursor=pointer]:
            - generic [ref=e807]:
              - img [ref=e808]
              - text: Linked Photos
            - generic [ref=e811]:
              - text: "3"
              - img [ref=e812]
          - button "Linked Documents 2" [ref=e814] [cursor=pointer]:
            - generic [ref=e815]:
              - img [ref=e816]
              - text: Linked Documents
            - generic [ref=e819]:
              - text: "2"
              - img [ref=e820]
          - button "Board Markups 1" [ref=e822] [cursor=pointer]:
            - generic [ref=e823]:
              - img [ref=e824]
              - text: Board Markups
            - generic [ref=e827]:
              - text: "1"
              - img [ref=e828]
          - button "Linked Costs 1" [ref=e830] [cursor=pointer]:
            - generic [ref=e831]:
              - img [ref=e832]
              - text: Linked Costs
            - generic [ref=e835]:
              - text: "1"
              - img [ref=e836]
        - generic [ref=e838]:
          - generic [ref=e839]:
            - heading "Linked Photos (3)" [level=3] [ref=e840]
            - button [ref=e841] [cursor=pointer]:
              - img [ref=e842]
          - generic [ref=e843]:
            - generic [ref=e844]:
              - img [ref=e846]
              - generic [ref=e863]:
                - generic [ref=e864]: P101_0456.JPG
                - generic [ref=e865]: May 11, 2025
                - generic [ref=e866]: Grid 6 / A-B
            - generic [ref=e867]:
              - img [ref=e869]
              - generic [ref=e886]:
                - generic [ref=e887]: P101_0457.JPG
                - generic [ref=e888]: May 11, 2025
                - generic [ref=e889]: Grid 6 / A-B
        - generic [ref=e890]:
          - generic [ref=e891]:
            - heading "Notes" [level=3] [ref=e892]
            - button "Edit note" [ref=e893] [cursor=pointer]:
              - img [ref=e894]
          - button "Seat angle connection shows heavy rust and section loss. Verify seat and bearing stiffener condition." [ref=e896] [cursor=pointer]
          - generic [ref=e897]: A. Morgan, May 12, 2025 9:15 AM
        - generic [ref=e898]:
          - generic [ref=e899]:
            - heading "Comments (1)" [level=3] [ref=e900]
            - img [ref=e901]
          - generic [ref=e904]:
            - generic [ref=e905]:
              - generic [ref=e906]: A. Morgan
              - button "Open" [ref=e907] [cursor=pointer]
            - paragraph [ref=e908]: Verify seat angle thickness and bearing stiffener condition during follow-up visit.
            - generic [ref=e909]: May 12, 2025 9:15 AM
          - textbox "Add engineering note or reply..." [ref=e910]
          - button "Add Comment" [ref=e911] [cursor=pointer]
        - generic [ref=e912]:
          - generic [ref=e913]:
            - heading "Issue Details" [level=3] [ref=e914]
            - img [ref=e915]
          - generic [ref=e917]:
            - generic [ref=e918]:
              - generic [ref=e919]: Issue Type
              - generic [ref=e920]: Corrosion
            - generic [ref=e921]:
              - generic [ref=e922]: Severity
              - generic [ref=e923]: Severe
            - generic [ref=e924]:
              - generic [ref=e925]: Recommendation
              - generic [ref=e926]: Repair
            - generic [ref=e927]:
              - generic [ref=e928]: Recommended Action
              - generic [ref=e929]: Grind, repair, prime and repaint
            - generic [ref=e930]:
              - generic [ref=e931]: Due Date
              - generic [ref=e932]: May 26, 2025
  - contentinfo [ref=e933]:
    - generic [ref=e934]: Select active. Click a markup to select it and show properties. Use Eraser to delete, Pan to move the view, Esc cancels active tools.
    - generic [ref=e935]: "X: 152'-3 1/2\" Y: 47'-6 3/4\" | Plan: 100% / Map: 100% | Grid: 1'-0\" ● Online"
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