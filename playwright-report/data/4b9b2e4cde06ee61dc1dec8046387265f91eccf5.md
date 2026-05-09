# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-workspace-tools.spec.ts >> Visual Workspace toolbar behavior >> Eraser is a mode and erases the clicked annotation only
- Location: tests\visual-workspace-tools.spec.ts:79:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('annotation-hit-1')

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
          - button "Eraser" [active] [ref=e154] [cursor=pointer]:
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
        - generic [ref=e467] [cursor=pointer]:
          - generic [ref=e470]: "1"
          - generic [ref=e473]: CORROSION AT SEAT CONN
          - generic [ref=e474]: FIELD VERIFY.
        - generic [ref=e482] [cursor=pointer]:
          - generic [ref=e485]: "2"
          - generic [ref=e488]: PAINT PEELING, RUST SC
          - generic [ref=e489]: FIELD VERIFY.
        - generic [ref=e490] [cursor=pointer]:
          - generic [ref=e493]: "3"
          - generic [ref=e496]: SECTION LOSS AT MIDSPA
          - generic [ref=e497]: FIELD VERIFY.
        - generic [ref=e498] [cursor=pointer]:
          - generic [ref=e501]: "4"
          - generic [ref=e504]: SURFACE RUST
          - generic [ref=e505]: FIELD VERIFY.
        - generic [ref=e506] [cursor=pointer]:
          - generic [ref=e509]: "5"
          - generic [ref=e512]: NO VISIBLE DISTRESS
          - generic [ref=e513]: FIELD VERIFY.
      - generic [ref=e514]:
        - generic [ref=e515]:
          - generic [ref=e516]:
            - text: Items / Markup Schedule
            - img [ref=e517]
          - table [ref=e520]:
            - rowgroup [ref=e521]:
              - row "ID Type Item Name Location Status Condition Priority Discipline Due Date" [ref=e522]:
                - columnheader "ID" [ref=e523]
                - columnheader "Type" [ref=e524]
                - columnheader "Item Name" [ref=e525]
                - columnheader "Location" [ref=e526]
                - columnheader "Status" [ref=e527]
                - columnheader "Condition" [ref=e528]
                - columnheader "Priority" [ref=e529]
                - columnheader "Discipline" [ref=e530]
                - columnheader "Due Date" [ref=e531]
            - rowgroup [ref=e532]:
              - row "1 Beam B12 Grid 6 / A-B Field Verify Corrosion at seat connection High Structural May 26, 2025" [ref=e533] [cursor=pointer]:
                - cell "1" [ref=e534]: "1"
                - cell "Beam" [ref=e536]
                - cell "B12" [ref=e537]
                - cell "Grid 6 / A-B" [ref=e538]
                - cell "Field Verify" [ref=e539]
                - cell "Corrosion at seat connection" [ref=e540]
                - cell "High" [ref=e541]
                - cell "Structural" [ref=e542]
                - cell "May 26, 2025" [ref=e543]
              - row "2 Beam B18 Grid 6 / B-C Field Verify Paint peeling, rust scale Medium Structural May 26, 2025" [ref=e544] [cursor=pointer]:
                - cell "2" [ref=e545]: "2"
                - cell "Beam" [ref=e547]
                - cell "B18" [ref=e548]
                - cell "Grid 6 / B-C" [ref=e549]
                - cell "Field Verify" [ref=e550]
                - cell "Paint peeling, rust scale" [ref=e551]
                - cell "Medium" [ref=e552]
                - cell "Structural" [ref=e553]
                - cell "May 26, 2025" [ref=e554]
              - row "3 Beam B31 Grid 5 / C-D Field Verify Section loss at midspan High Structural May 26, 2025" [ref=e555] [cursor=pointer]:
                - cell "3" [ref=e556]: "3"
                - cell "Beam" [ref=e558]
                - cell "B31" [ref=e559]
                - cell "Grid 5 / C-D" [ref=e560]
                - cell "Field Verify" [ref=e561]
                - cell "Section loss at midspan" [ref=e562]
                - cell "High" [ref=e563]
                - cell "Structural" [ref=e564]
                - cell "May 26, 2025" [ref=e565]
              - row "4 Column C16 Grid 5 / B-C Monitor Surface rust Low Structural Jun 10, 2025" [ref=e566] [cursor=pointer]:
                - cell "4" [ref=e567]: "4"
                - cell "Column" [ref=e569]
                - cell "C16" [ref=e570]
                - cell "Grid 5 / B-C" [ref=e571]
                - cell "Monitor" [ref=e572]
                - cell "Surface rust" [ref=e573]
                - cell "Low" [ref=e574]
                - cell "Structural" [ref=e575]
                - cell "Jun 10, 2025" [ref=e576]
              - row "5 Beam B7 Grid 2 / A-B Complete No visible distress Low Structural —" [ref=e577] [cursor=pointer]:
                - cell "5" [ref=e578]: "5"
                - cell "Beam" [ref=e580]
                - cell "B7" [ref=e581]
                - cell "Grid 2 / A-B" [ref=e582]
                - cell "Complete" [ref=e583]
                - cell "No visible distress" [ref=e584]
                - cell "Low" [ref=e585]
                - cell "Structural" [ref=e586]
                - cell "—" [ref=e587]
          - generic [ref=e588]: 1–5 of 5 items
        - generic [ref=e589]:
          - generic [ref=e590]:
            - text: Relationship Map / Blueprint
            - generic [ref=e591]: Click nodes to inspect links
          - generic [ref=e592]:
            - img [ref=e593]:
              - generic [ref=e598]: refers to
              - generic [ref=e602]: has
              - generic [ref=e606]: impacts
              - generic [ref=e610]: relates
              - generic [ref=e614]: referenced by
            - 'button "Plan Marker #1 Location" [ref=e615] [cursor=pointer]':
              - generic [ref=e616]: "Plan Marker #1"
              - generic [ref=e617]: Location
            - button "1 Beam B12 Project Item" [ref=e618] [cursor=pointer]:
              - generic [ref=e619]: "1"
              - generic [ref=e620]: Beam B12
              - generic [ref=e621]: Project Item
            - button "Site Photos (3) Photo Set" [ref=e622] [cursor=pointer]:
              - generic [ref=e623]: Site Photos (3)
              - generic [ref=e624]: Photo Set
            - button "Board Markups (1) Board Annotations" [ref=e625] [cursor=pointer]:
              - generic [ref=e626]: Board Markups (1)
              - generic [ref=e627]: Board Annotations
            - button "Cost Item C-102 Cost" [ref=e628] [cursor=pointer]:
              - generic [ref=e629]: Cost Item C-102
              - generic [ref=e630]: Cost
            - button "Document S-2.3 Document" [ref=e631] [cursor=pointer]:
              - generic [ref=e632]: Document S-2.3
              - generic [ref=e633]: Document
            - generic [ref=e634]:
              - generic [ref=e635]: Selected Blueprint Node
              - generic [ref=e636]: Beam B12
              - generic [ref=e637]: Project Item
              - generic [ref=e638]:
                - generic [ref=e639]:
                  - generic [ref=e640]: Links
                  - generic [ref=e641]: "4"
                - generic [ref=e642]:
                  - generic [ref=e643]: Count
                  - generic [ref=e644]: "1"
              - generic [ref=e645]:
                - generic [ref=e646]: Details
                - generic [ref=e647]: W16x26
            - generic [ref=e648]:
              - button "−" [ref=e649] [cursor=pointer]
              - generic [ref=e650]: 100%
              - button "+" [ref=e651] [cursor=pointer]
              - button [ref=e652] [cursor=pointer]:
                - img [ref=e653]
    - complementary [ref=e658]:
      - generic [ref=e659]:
        - heading "Site Photos" [level=2] [ref=e660]
        - generic [ref=e661]:
          - button "Filter linked photos" [ref=e662] [cursor=pointer]:
            - img [ref=e663]
          - button "Collapse photos panel" [ref=e665] [cursor=pointer]:
            - img [ref=e666]
      - generic [ref=e669]:
        - button "1 P101_0456.JPG May 11, 2025 Grid 6 / A-B" [ref=e670] [cursor=pointer]:
          - generic [ref=e671]:
            - img [ref=e672]
            - generic [ref=e689]: "1"
          - generic [ref=e690]:
            - generic [ref=e691]:
              - generic [ref=e692]: P101_0456.JPG
              - generic [ref=e693]: May 11, 2025
            - generic [ref=e694]: Grid 6 / A-B
        - button "2 P101_0461.JPG May 11, 2025 Grid 6 / B-C" [ref=e695] [cursor=pointer]:
          - generic [ref=e696]:
            - img [ref=e697]
            - generic [ref=e714]: "2"
          - generic [ref=e715]:
            - generic [ref=e716]:
              - generic [ref=e717]: P101_0461.JPG
              - generic [ref=e718]: May 11, 2025
            - generic [ref=e719]: Grid 6 / B-C
        - button "3 P101_0468.JPG May 11, 2025 Grid 5 / C-D" [ref=e720] [cursor=pointer]:
          - generic [ref=e721]:
            - img [ref=e722]
            - generic [ref=e739]: "3"
          - generic [ref=e740]:
            - generic [ref=e741]:
              - generic [ref=e742]: P101_0468.JPG
              - generic [ref=e743]: May 11, 2025
            - generic [ref=e744]: Grid 5 / C-D
        - button "View all photos (5)" [ref=e745] [cursor=pointer]
    - complementary [ref=e746]:
      - generic [ref=e747]:
        - heading "Inspector" [level=2] [ref=e748]
        - button [ref=e749] [cursor=pointer]:
          - img [ref=e750]
      - generic [ref=e753]:
        - generic [ref=e754]:
          - generic [ref=e755]:
            - generic [ref=e756]:
              - generic [ref=e757]: "1"
              - heading "Beam B12" [level=2] [ref=e759]
            - button "Field Verify" [ref=e760] [cursor=pointer]:
              - text: Field Verify
              - img [ref=e761]
          - generic [ref=e763]:
            - generic [ref=e764]:
              - generic [ref=e765]: Item Name
              - generic [ref=e766]: Beam B12
            - generic [ref=e767]:
              - generic [ref=e768]: Type
              - generic [ref=e769]: Steel Beam
            - generic [ref=e770]:
              - generic [ref=e771]: Status
              - button "Field Verify" [ref=e773] [cursor=pointer]
            - generic [ref=e774]:
              - generic [ref=e775]: Section
              - generic [ref=e776]: W16x26
            - generic [ref=e777]:
              - generic [ref=e778]: Location
              - generic [ref=e779]: Grid 6 / A-B
            - generic [ref=e780]:
              - generic [ref=e781]: Elevation
              - generic [ref=e782]: +14&apos;-0&quot; (T.O.S.)
            - generic [ref=e783]:
              - generic [ref=e784]: Condition
              - button "Corrosion at seat connection" [ref=e786] [cursor=pointer]
            - generic [ref=e787]:
              - generic [ref=e788]: Priority
              - button "High" [ref=e790] [cursor=pointer]
            - generic [ref=e791]:
              - generic [ref=e792]: Discipline
              - generic [ref=e793]: Structural
            - generic [ref=e794]:
              - generic [ref=e795]: Created By
              - generic [ref=e796]: A. Morgan
            - generic [ref=e797]:
              - generic [ref=e798]: Date
              - generic [ref=e799]: May 12, 2025
        - generic [ref=e800]:
          - button "Linked Photos 3" [ref=e801] [cursor=pointer]:
            - generic [ref=e802]:
              - img [ref=e803]
              - text: Linked Photos
            - generic [ref=e806]:
              - text: "3"
              - img [ref=e807]
          - button "Linked Documents 2" [ref=e809] [cursor=pointer]:
            - generic [ref=e810]:
              - img [ref=e811]
              - text: Linked Documents
            - generic [ref=e814]:
              - text: "2"
              - img [ref=e815]
          - button "Board Markups 1" [ref=e817] [cursor=pointer]:
            - generic [ref=e818]:
              - img [ref=e819]
              - text: Board Markups
            - generic [ref=e822]:
              - text: "1"
              - img [ref=e823]
          - button "Linked Costs 1" [ref=e825] [cursor=pointer]:
            - generic [ref=e826]:
              - img [ref=e827]
              - text: Linked Costs
            - generic [ref=e830]:
              - text: "1"
              - img [ref=e831]
        - generic [ref=e833]:
          - generic [ref=e834]:
            - heading "Linked Photos (3)" [level=3] [ref=e835]
            - button [ref=e836] [cursor=pointer]:
              - img [ref=e837]
          - generic [ref=e838]:
            - generic [ref=e839]:
              - img [ref=e841]
              - generic [ref=e858]:
                - generic [ref=e859]: P101_0456.JPG
                - generic [ref=e860]: May 11, 2025
                - generic [ref=e861]: Grid 6 / A-B
            - generic [ref=e862]:
              - img [ref=e864]
              - generic [ref=e881]:
                - generic [ref=e882]: P101_0457.JPG
                - generic [ref=e883]: May 11, 2025
                - generic [ref=e884]: Grid 6 / A-B
        - generic [ref=e885]:
          - generic [ref=e886]:
            - heading "Notes" [level=3] [ref=e887]
            - button "Edit note" [ref=e888] [cursor=pointer]:
              - img [ref=e889]
          - button "Seat angle connection shows heavy rust and section loss. Verify seat and bearing stiffener condition." [ref=e891] [cursor=pointer]
          - generic [ref=e892]: A. Morgan, May 12, 2025 9:15 AM
        - generic [ref=e893]:
          - generic [ref=e894]:
            - heading "Comments (1)" [level=3] [ref=e895]
            - img [ref=e896]
          - generic [ref=e899]:
            - generic [ref=e900]:
              - generic [ref=e901]: A. Morgan
              - button "Open" [ref=e902] [cursor=pointer]
            - paragraph [ref=e903]: Verify seat angle thickness and bearing stiffener condition during follow-up visit.
            - generic [ref=e904]: May 12, 2025 9:15 AM
          - textbox "Add engineering note or reply..." [ref=e905]
          - button "Add Comment" [ref=e906] [cursor=pointer]
        - generic [ref=e907]:
          - generic [ref=e908]:
            - heading "Issue Details" [level=3] [ref=e909]
            - img [ref=e910]
          - generic [ref=e912]:
            - generic [ref=e913]:
              - generic [ref=e914]: Issue Type
              - generic [ref=e915]: Corrosion
            - generic [ref=e916]:
              - generic [ref=e917]: Severity
              - generic [ref=e918]: Severe
            - generic [ref=e919]:
              - generic [ref=e920]: Recommendation
              - generic [ref=e921]: Repair
            - generic [ref=e922]:
              - generic [ref=e923]: Recommended Action
              - generic [ref=e924]: Grind, repair, prime and repaint
            - generic [ref=e925]:
              - generic [ref=e926]: Due Date
              - generic [ref=e927]: May 26, 2025
  - contentinfo [ref=e928]:
    - generic [ref=e929]: Eraser active. Click the annotation you want erased. Press Esc for Select.
    - generic [ref=e930]: "X: 152'-3 1/2\" Y: 47'-6 3/4\" | Plan: 100% / Map: 100% | Grid: 1'-0\" ● Online"
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
  14  | async function dragOnCanvas(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  15  |   const layer = page.getByTestId('plan-event-layer');
  16  |   const canvas = (await layer.count()) ? layer : page.getByTestId('plan-canvas');
  17  |   const box = await canvas.boundingBox();
  18  |   if (!box) throw new Error('plan canvas not visible');
  19  | 
  20  |   await page.mouse.move(box.x + start.x, box.y + start.y);
  21  |   await page.mouse.down();
  22  |   await page.mouse.move(box.x + end.x, box.y + end.y, { steps: 12 });
  23  |   await page.mouse.up();
  24  |   await page.waitForTimeout(150);
  25  | }
  26  | 
  27  | async function getBox(locator: Locator) {
  28  |   const box = await locator.boundingBox();
  29  |   if (!box) throw new Error('element has no bounding box');
  30  |   return box;
  31  | }
  32  | 
  33  | test.describe('Visual Workspace toolbar behavior', () => {
  34  |   test.beforeEach(async ({ page }) => {
  35  |     await openWorkspace(page);
  36  |   });
  37  | 
  38  |   test('Select only selects an annotation and does not move it on click', async ({ page }) => {
  39  |     await page.getByTestId('tool-select').click();
  40  | 
  41  |     const annotation = page.getByTestId('annotation-hit-1');
  42  |     const before = await getBox(annotation);
  43  | 
  44  |     await annotation.click({ position: { x: 10, y: 10 }, force: true });
  45  |     await expect(page.getByTestId('inspector-title')).toContainText(/B12|N1|Text|Beam/);
  46  | 
  47  |     const after = await getBox(annotation);
  48  |     expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  49  |     expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  50  |   });
  51  | 
  52  |   test('Cloud tool creates a new annotation from a drag', async ({ page }) => {
  53  |     const before = await annotationCount(page);
  54  | 
  55  |     await page.getByTestId('tool-cloud').click();
  56  |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Cloud');
  57  | 
  58  |     await dragOnCanvas(page, { x: 360, y: 180 }, { x: 560, y: 260 });
  59  | 
  60  |     await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
  61  |     await expect(page.getByTestId('inspector-title')).toBeVisible();
  62  |   });
  63  | 
  64  |   test('Text tool prompts for text and creates actual text annotation', async ({ page }) => {
  65  |     const before = await annotationCount(page);
  66  | 
  67  |     page.once('dialog', async (dialog) => {
  68  |       expect(dialog.type()).toBe('prompt');
  69  |       await dialog.accept('FIELD NOTE TEST');
  70  |     });
  71  | 
  72  |     await page.getByTestId('tool-text').click();
  73  |     await dragOnCanvas(page, { x: 420, y: 210 }, { x: 620, y: 260 });
  74  | 
  75  |     await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
  76  |     await expect(page.getByText('FIELD NOTE TEST')).toBeVisible();
  77  |   });
  78  | 
  79  |   test('Eraser is a mode and erases the clicked annotation only', async ({ page }) => {
  80  |     const before = await annotationCount(page);
  81  | 
  82  |     await page.getByTestId('tool-eraser').click();
  83  |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
  84  | 
> 85  |     await page.getByTestId('annotation-hit-1').click({ force: true });
      |                                                ^ Error: locator.click: Test timeout of 30000ms exceeded.
  86  | 
  87  |     await expect.poll(() => annotationCount(page)).toBe(before - 1);
  88  |     await expect(page.getByTestId('plan-canvas')).toBeVisible();
  89  |   });
  90  | 
  91  |   test('Escape cancels active tool back to Select', async ({ page }) => {
  92  |     await page.getByTestId('tool-eraser').click();
  93  |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
  94  | 
  95  |     await page.keyboard.press('Escape');
  96  | 
  97  |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  98  |   });
  99  | 
  100 |   test('Pan moves the view and Fit resets it', async ({ page }) => {
  101 |     const transform = page.getByTestId('plan-transform');
  102 | 
  103 |     await page.getByTestId('tool-pan').click();
  104 |     await dragOnCanvas(page, { x: 360, y: 240 }, { x: 440, y: 300 });
  105 | 
  106 |     await expect(transform).not.toHaveAttribute('data-plan-pan-x', '0');
  107 | 
  108 |     await page.getByTestId('tool-fit').click();
  109 | 
  110 |     await expect(transform).toHaveAttribute('data-plan-zoom', '1');
  111 |     await expect(transform).toHaveAttribute('data-plan-pan-x', '0');
  112 |     await expect(transform).toHaveAttribute('data-plan-pan-y', '0');
  113 |   });
  114 | 
  115 |   test('Zoom mode uses wheel and Escape cancels', async ({ page }) => {
  116 |     const transform = page.getByTestId('plan-transform');
  117 |     await expect(transform).toHaveAttribute('data-plan-zoom', '1');
  118 | 
  119 |     await page.getByTestId('tool-zoom').click();
  120 |     const canvas = page.getByTestId('plan-event-layer');
  121 |     const box = await canvas.boundingBox();
  122 |     if (!box) throw new Error('plan canvas not visible');
  123 | 
  124 |     await page.mouse.move(box.x + 450, box.y + 250);
  125 |     await page.mouse.wheel(0, -400);
  126 |     await page.mouse.wheel(0, -400);
  127 | 
  128 |     await expect(transform).not.toHaveAttribute('data-plan-zoom', '1');
  129 | 
  130 |     await page.keyboard.press('Escape');
  131 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  132 |   });
  133 | 
  134 |   test('Color opens palette and changes selected annotation color', async ({ page }) => {
  135 |     await page.getByTestId('tool-select').click();
  136 |     await page.getByTestId('annotation-hit-1').click();
  137 | 
  138 |     await page.getByTestId('tool-color').click();
  139 |     await expect(page.getByTestId('active-panel-title')).toContainText('Choose markup color');
  140 |   });
  141 | 
  142 |   test('Photo, File, and Note tools open their panels', async ({ page }) => {
  143 |     await page.getByTestId('tool-photo').click();
  144 |     await expect(page.getByTestId('active-panel-title')).toContainText('Add or choose site photo');
  145 |     await page.getByTestId('close-active-panel').click();
  146 | 
  147 |     await page.getByTestId('tool-file').click();
  148 |     await expect(page.getByTestId('active-panel-title')).toContainText('Attach document');
  149 |     await page.getByTestId('close-active-panel').click();
  150 | 
  151 |     await page.getByTestId('tool-note').click();
  152 |     await expect(page.getByTestId('active-panel-title')).toContainText('Add note');
  153 |   });
  154 | 
  155 |   test('View all photos opens photo library', async ({ page }) => {
  156 |     await page.getByTestId('view-all-photos').click();
  157 |     await expect(page.getByTestId('photo-library-title')).toBeVisible();
  158 |   });
  159 | 
  160 |   test('Distance requires scale first', async ({ page }) => {
  161 |     const before = await annotationCount(page);
  162 | 
  163 |     await page.getByTestId('tool-distance').click();
  164 |     await dragOnCanvas(page, { x: 300, y: 200 }, { x: 470, y: 200 });
  165 | 
  166 |     await expect.poll(() => annotationCount(page)).toBe(before);
  167 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Distance');
  168 |   });
  169 | });
  170 | 
```