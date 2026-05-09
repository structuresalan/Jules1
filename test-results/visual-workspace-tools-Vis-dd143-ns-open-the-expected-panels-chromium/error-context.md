# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-workspace-tools.spec.ts >> Visual Workspace pressable control coverage >> primary modal and panel buttons open the expected panels
- Location: tests\visual-workspace-tools.spec.ts:309:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('active-panel-title')
Expected substring: "Workspace settings"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByTestId('active-panel-title')

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
          - button "Scale" [active] [ref=e175] [cursor=pointer]:
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
        - img [ref=e365]:
          - generic [ref=e370]: "1"
          - generic [ref=e373]: "2"
          - generic [ref=e376]: "3"
          - generic [ref=e379]: "4"
          - generic [ref=e382]: "5"
          - generic [ref=e385]: "6"
          - generic [ref=e388]: "7"
          - generic [ref=e391]: A
          - generic [ref=e394]: B
          - generic [ref=e397]: C
          - generic [ref=e400]: D
          - generic [ref=e431]:
            - generic [ref=e432]: B1 (W16x26)
            - generic [ref=e433]: B2 (W16x26)
            - generic [ref=e434]: B3 (W16x26)
            - generic [ref=e435]: B4 (W16x26)
            - generic [ref=e436]: B5 (W16x26)
            - generic [ref=e437]: B6 (W16x26)
            - generic [ref=e438]: B7 (W16x26)
            - generic [ref=e439]: B8 (W16x26)
            - generic [ref=e440]: B9 (W16x26)
            - generic [ref=e441]: B10 (W16x26)
            - generic [ref=e442]: B11 (W16x26)
            - generic [ref=e443]: B12 (W16x26)
            - generic [ref=e444]: B13 (W16x26)
            - generic [ref=e445]: B14 (W16x26)
            - generic [ref=e446]: B15 (W16x26)
            - generic [ref=e447]: B16 (W16x26)
            - generic [ref=e448]: B17 (W16x26)
            - generic [ref=e449]: B18 (W16x26)
            - generic [ref=e450]: B19 (W16x26)
            - generic [ref=e451]: B20 (W16x26)
            - generic [ref=e452]: B21 (W16x26)
            - generic [ref=e453]: B22 (W16x26)
            - generic [ref=e454]: B23 (W16x26)
            - generic [ref=e455]: B24 (W16x26)
          - generic [ref=e462]: P-3-2
          - generic [ref=e463]:
            - generic [ref=e464]: 24'-0"
            - generic [ref=e465]: 24'-0"
            - generic [ref=e466]: 24'-0"
            - generic [ref=e467]: 180'-0"
          - generic [ref=e468] [cursor=pointer]:
            - generic [ref=e471]: "1"
            - generic [ref=e474]: CORROSION AT SEAT CONN
            - generic [ref=e475]: FIELD VERIFY.
          - generic [ref=e483] [cursor=pointer]:
            - generic [ref=e486]: "2"
            - generic [ref=e489]: PAINT PEELING, RUST SC
            - generic [ref=e490]: FIELD VERIFY.
          - generic [ref=e491] [cursor=pointer]:
            - generic [ref=e494]: "3"
            - generic [ref=e497]: SECTION LOSS AT MIDSPA
            - generic [ref=e498]: FIELD VERIFY.
          - generic [ref=e499] [cursor=pointer]:
            - generic [ref=e502]: "4"
            - generic [ref=e505]: SURFACE RUST
            - generic [ref=e506]: FIELD VERIFY.
          - generic [ref=e507] [cursor=pointer]:
            - generic [ref=e510]: "5"
            - generic [ref=e513]: NO VISIBLE DISTRESS
            - generic [ref=e514]: FIELD VERIFY.
        - generic:
          - button "Annotation 1"
          - button "Annotation 2"
          - button "Annotation 3"
          - button "Annotation 4"
          - button "Annotation 5"
      - generic [ref=e515]:
        - generic [ref=e516]:
          - generic [ref=e517]:
            - text: Items / Markup Schedule
            - img [ref=e518]
          - table [ref=e521]:
            - rowgroup [ref=e522]:
              - row "ID Type Item Name Location Status Condition Priority Discipline Due Date" [ref=e523]:
                - columnheader "ID" [ref=e524]
                - columnheader "Type" [ref=e525]
                - columnheader "Item Name" [ref=e526]
                - columnheader "Location" [ref=e527]
                - columnheader "Status" [ref=e528]
                - columnheader "Condition" [ref=e529]
                - columnheader "Priority" [ref=e530]
                - columnheader "Discipline" [ref=e531]
                - columnheader "Due Date" [ref=e532]
            - rowgroup [ref=e533]:
              - row "1 Beam B12 Grid 6 / A-B Field Verify Corrosion at seat connection High Structural May 26, 2025" [ref=e534] [cursor=pointer]:
                - cell "1" [ref=e535]: "1"
                - cell "Beam" [ref=e537]
                - cell "B12" [ref=e538]
                - cell "Grid 6 / A-B" [ref=e539]
                - cell "Field Verify" [ref=e540]
                - cell "Corrosion at seat connection" [ref=e541]
                - cell "High" [ref=e542]
                - cell "Structural" [ref=e543]
                - cell "May 26, 2025" [ref=e544]
              - row "2 Beam B18 Grid 6 / B-C Field Verify Paint peeling, rust scale Medium Structural May 26, 2025" [ref=e545] [cursor=pointer]:
                - cell "2" [ref=e546]: "2"
                - cell "Beam" [ref=e548]
                - cell "B18" [ref=e549]
                - cell "Grid 6 / B-C" [ref=e550]
                - cell "Field Verify" [ref=e551]
                - cell "Paint peeling, rust scale" [ref=e552]
                - cell "Medium" [ref=e553]
                - cell "Structural" [ref=e554]
                - cell "May 26, 2025" [ref=e555]
              - row "3 Beam B31 Grid 5 / C-D Field Verify Section loss at midspan High Structural May 26, 2025" [ref=e556] [cursor=pointer]:
                - cell "3" [ref=e557]: "3"
                - cell "Beam" [ref=e559]
                - cell "B31" [ref=e560]
                - cell "Grid 5 / C-D" [ref=e561]
                - cell "Field Verify" [ref=e562]
                - cell "Section loss at midspan" [ref=e563]
                - cell "High" [ref=e564]
                - cell "Structural" [ref=e565]
                - cell "May 26, 2025" [ref=e566]
              - row "4 Column C16 Grid 5 / B-C Monitor Surface rust Low Structural Jun 10, 2025" [ref=e567] [cursor=pointer]:
                - cell "4" [ref=e568]: "4"
                - cell "Column" [ref=e570]
                - cell "C16" [ref=e571]
                - cell "Grid 5 / B-C" [ref=e572]
                - cell "Monitor" [ref=e573]
                - cell "Surface rust" [ref=e574]
                - cell "Low" [ref=e575]
                - cell "Structural" [ref=e576]
                - cell "Jun 10, 2025" [ref=e577]
              - row "5 Beam B7 Grid 2 / A-B Complete No visible distress Low Structural —" [ref=e578] [cursor=pointer]:
                - cell "5" [ref=e579]: "5"
                - cell "Beam" [ref=e581]
                - cell "B7" [ref=e582]
                - cell "Grid 2 / A-B" [ref=e583]
                - cell "Complete" [ref=e584]
                - cell "No visible distress" [ref=e585]
                - cell "Low" [ref=e586]
                - cell "Structural" [ref=e587]
                - cell "—" [ref=e588]
          - generic [ref=e589]: 1–5 of 5 items
        - generic [ref=e590]:
          - generic [ref=e591]:
            - text: Relationship Map / Blueprint
            - generic [ref=e592]: Click nodes to inspect links
          - generic [ref=e593]:
            - img [ref=e594]:
              - generic [ref=e599]: refers to
              - generic [ref=e603]: has
              - generic [ref=e607]: impacts
              - generic [ref=e611]: relates
              - generic [ref=e615]: referenced by
            - 'button "Plan Marker #1 Location" [ref=e616] [cursor=pointer]':
              - generic [ref=e617]: "Plan Marker #1"
              - generic [ref=e618]: Location
            - button "1 Beam B12 Project Item" [ref=e619] [cursor=pointer]:
              - generic [ref=e620]: "1"
              - generic [ref=e621]: Beam B12
              - generic [ref=e622]: Project Item
            - button "Site Photos (3) Photo Set" [ref=e623] [cursor=pointer]:
              - generic [ref=e624]: Site Photos (3)
              - generic [ref=e625]: Photo Set
            - button "Board Markups (1) Board Annotations" [ref=e626] [cursor=pointer]:
              - generic [ref=e627]: Board Markups (1)
              - generic [ref=e628]: Board Annotations
            - button "Cost Item C-102 Cost" [ref=e629] [cursor=pointer]:
              - generic [ref=e630]: Cost Item C-102
              - generic [ref=e631]: Cost
            - button "Document S-2.3 Document" [ref=e632] [cursor=pointer]:
              - generic [ref=e633]: Document S-2.3
              - generic [ref=e634]: Document
            - generic [ref=e635]:
              - generic [ref=e636]: Selected Blueprint Node
              - generic [ref=e637]: Beam B12
              - generic [ref=e638]: Project Item
              - generic [ref=e639]:
                - generic [ref=e640]:
                  - generic [ref=e641]: Links
                  - generic [ref=e642]: "4"
                - generic [ref=e643]:
                  - generic [ref=e644]: Count
                  - generic [ref=e645]: "1"
              - generic [ref=e646]:
                - generic [ref=e647]: Details
                - generic [ref=e648]: W16x26
            - generic [ref=e649]:
              - button "−" [ref=e650] [cursor=pointer]
              - generic [ref=e651]: 100%
              - button "+" [ref=e652] [cursor=pointer]
              - button [ref=e653] [cursor=pointer]:
                - img [ref=e654]
    - complementary [ref=e659]:
      - generic [ref=e660]:
        - heading "Site Photos" [level=2] [ref=e661]
        - generic [ref=e662]:
          - button "Filter linked photos" [ref=e663] [cursor=pointer]:
            - img [ref=e664]
          - button "Collapse photos panel" [ref=e666] [cursor=pointer]:
            - img [ref=e667]
      - generic [ref=e670]:
        - button "1 P101_0456.JPG May 11, 2025 Grid 6 / A-B" [ref=e671] [cursor=pointer]:
          - generic [ref=e672]:
            - img [ref=e673]
            - generic [ref=e690]: "1"
          - generic [ref=e691]:
            - generic [ref=e692]:
              - generic [ref=e693]: P101_0456.JPG
              - generic [ref=e694]: May 11, 2025
            - generic [ref=e695]: Grid 6 / A-B
        - button "2 P101_0461.JPG May 11, 2025 Grid 6 / B-C" [ref=e696] [cursor=pointer]:
          - generic [ref=e697]:
            - img [ref=e698]
            - generic [ref=e715]: "2"
          - generic [ref=e716]:
            - generic [ref=e717]:
              - generic [ref=e718]: P101_0461.JPG
              - generic [ref=e719]: May 11, 2025
            - generic [ref=e720]: Grid 6 / B-C
        - button "3 P101_0468.JPG May 11, 2025 Grid 5 / C-D" [ref=e721] [cursor=pointer]:
          - generic [ref=e722]:
            - img [ref=e723]
            - generic [ref=e740]: "3"
          - generic [ref=e741]:
            - generic [ref=e742]:
              - generic [ref=e743]: P101_0468.JPG
              - generic [ref=e744]: May 11, 2025
            - generic [ref=e745]: Grid 5 / C-D
        - button "View all photos (5)" [ref=e746] [cursor=pointer]
    - complementary [ref=e747]:
      - generic [ref=e748]:
        - heading "Inspector" [level=2] [ref=e749]
        - button [ref=e750] [cursor=pointer]:
          - img [ref=e751]
      - generic [ref=e754]:
        - generic [ref=e755]:
          - generic [ref=e756]:
            - generic [ref=e757]:
              - generic [ref=e758]: "1"
              - heading "Beam B12" [level=2] [ref=e760]
            - button "Field Verify" [ref=e761] [cursor=pointer]:
              - text: Field Verify
              - img [ref=e762]
          - generic [ref=e764]:
            - generic [ref=e765]:
              - generic [ref=e766]: Item Name
              - generic [ref=e767]: Beam B12
            - generic [ref=e768]:
              - generic [ref=e769]: Type
              - generic [ref=e770]: Steel Beam
            - generic [ref=e771]:
              - generic [ref=e772]: Status
              - button "Field Verify" [ref=e774] [cursor=pointer]
            - generic [ref=e775]:
              - generic [ref=e776]: Section
              - generic [ref=e777]: W16x26
            - generic [ref=e778]:
              - generic [ref=e779]: Location
              - generic [ref=e780]: Grid 6 / A-B
            - generic [ref=e781]:
              - generic [ref=e782]: Elevation
              - generic [ref=e783]: +14&apos;-0&quot; (T.O.S.)
            - generic [ref=e784]:
              - generic [ref=e785]: Condition
              - button "Corrosion at seat connection" [ref=e787] [cursor=pointer]
            - generic [ref=e788]:
              - generic [ref=e789]: Priority
              - button "High" [ref=e791] [cursor=pointer]
            - generic [ref=e792]:
              - generic [ref=e793]: Discipline
              - generic [ref=e794]: Structural
            - generic [ref=e795]:
              - generic [ref=e796]: Created By
              - generic [ref=e797]: A. Morgan
            - generic [ref=e798]:
              - generic [ref=e799]: Date
              - generic [ref=e800]: May 12, 2025
        - generic [ref=e801]:
          - button "Linked Photos 3" [ref=e802] [cursor=pointer]:
            - generic [ref=e803]:
              - img [ref=e804]
              - text: Linked Photos
            - generic [ref=e807]:
              - text: "3"
              - img [ref=e808]
          - button "Linked Documents 2" [ref=e810] [cursor=pointer]:
            - generic [ref=e811]:
              - img [ref=e812]
              - text: Linked Documents
            - generic [ref=e815]:
              - text: "2"
              - img [ref=e816]
          - button "Board Markups 1" [ref=e818] [cursor=pointer]:
            - generic [ref=e819]:
              - img [ref=e820]
              - text: Board Markups
            - generic [ref=e823]:
              - text: "1"
              - img [ref=e824]
          - button "Linked Costs 1" [ref=e826] [cursor=pointer]:
            - generic [ref=e827]:
              - img [ref=e828]
              - text: Linked Costs
            - generic [ref=e831]:
              - text: "1"
              - img [ref=e832]
        - generic [ref=e834]:
          - generic [ref=e835]:
            - heading "Linked Photos (3)" [level=3] [ref=e836]
            - button [ref=e837] [cursor=pointer]:
              - img [ref=e838]
          - generic [ref=e839]:
            - generic [ref=e840]:
              - img [ref=e842]
              - generic [ref=e859]:
                - generic [ref=e860]: P101_0456.JPG
                - generic [ref=e861]: May 11, 2025
                - generic [ref=e862]: Grid 6 / A-B
            - generic [ref=e863]:
              - img [ref=e865]
              - generic [ref=e882]:
                - generic [ref=e883]: P101_0457.JPG
                - generic [ref=e884]: May 11, 2025
                - generic [ref=e885]: Grid 6 / A-B
        - generic [ref=e886]:
          - generic [ref=e887]:
            - heading "Notes" [level=3] [ref=e888]
            - button "Edit note" [ref=e889] [cursor=pointer]:
              - img [ref=e890]
          - button "Seat angle connection shows heavy rust and section loss. Verify seat and bearing stiffener condition." [ref=e892] [cursor=pointer]
          - generic [ref=e893]: A. Morgan, May 12, 2025 9:15 AM
        - generic [ref=e894]:
          - generic [ref=e895]:
            - heading "Comments (1)" [level=3] [ref=e896]
            - img [ref=e897]
          - generic [ref=e900]:
            - generic [ref=e901]:
              - generic [ref=e902]: A. Morgan
              - button "Open" [ref=e903] [cursor=pointer]
            - paragraph [ref=e904]: Verify seat angle thickness and bearing stiffener condition during follow-up visit.
            - generic [ref=e905]: May 12, 2025 9:15 AM
          - textbox "Add engineering note or reply..." [ref=e906]
          - button "Add Comment" [ref=e907] [cursor=pointer]
        - generic [ref=e908]:
          - generic [ref=e909]:
            - heading "Issue Details" [level=3] [ref=e910]
            - img [ref=e911]
          - generic [ref=e913]:
            - generic [ref=e914]:
              - generic [ref=e915]: Issue Type
              - generic [ref=e916]: Corrosion
            - generic [ref=e917]:
              - generic [ref=e918]: Severity
              - generic [ref=e919]: Severe
            - generic [ref=e920]:
              - generic [ref=e921]: Recommendation
              - generic [ref=e922]: Repair
            - generic [ref=e923]:
              - generic [ref=e924]: Recommended Action
              - generic [ref=e925]: Grind, repair, prime and repaint
            - generic [ref=e926]:
              - generic [ref=e927]: Due Date
              - generic [ref=e928]: May 26, 2025
  - contentinfo [ref=e929]:
    - generic [ref=e930]: Scale tool active. Use the board canvas to place or edit this markup.
    - generic [ref=e931]: "X: 152'-3 1/2\" Y: 47'-6 3/4\" | Plan: 100% / Map: 100% | Grid: 1'-0\" ● Online"
```

# Test source

```ts
  217 | 
  218 | const toolbarButtons = [
  219 |   ['tool-select', 'Select'],
  220 |   ['tool-pan', 'Pan'],
  221 |   ['tool-zoom', 'Zoom'],
  222 |   ['tool-fit', 'Fit'],
  223 |   ['tool-zoom-area', 'Zoom Area'],
  224 |   ['tool-arrow', 'Arrow'],
  225 |   ['tool-cloud', 'Cloud'],
  226 |   ['tool-text', 'Text'],
  227 |   ['tool-box', 'Box'],
  228 |   ['tool-callout', 'Callout'],
  229 |   ['tool-dimension', 'Dimension'],
  230 |   ['tool-distance', 'Distance'],
  231 |   ['tool-angle', 'Angle'],
  232 |   ['tool-area', 'Area'],
  233 |   ['tool-note', 'Note'],
  234 |   ['tool-photo', 'Photo'],
  235 |   ['tool-file', 'File'],
  236 |   ['tool-link', 'Link'],
  237 |   ['tool-highlighter', 'Highlighter'],
  238 |   ['tool-pen', 'Pen'],
  239 |   ['tool-eraser', 'Eraser'],
  240 |   ['tool-color', 'Color'],
  241 |   ['tool-layers', 'Layers'],
  242 |   ['tool-scale', 'Scale'],
  243 |   ['tool-grid', 'Grid'],
  244 |   ['tool-snap', 'Snap'],
  245 |   ['tool-undo', 'Undo'],
  246 |   ['tool-redo', 'Redo'],
  247 |   ['tool-more', 'More'],
  248 | ] as const;
  249 | 
  250 | const namedWorkspaceButtons = [
  251 |   'Workspace',
  252 |   'Review',
  253 |   'Report',
  254 |   'Export',
  255 |   'Add board',
  256 |   'Reset active board',
  257 |   'Filter linked photos',
  258 |   'Collapse photos panel',
  259 |   'View all photos (5)',
  260 |   'Linked Photos 3',
  261 |   'Linked Documents 2',
  262 |   'Board Markups 1',
  263 |   'Linked Costs 1',
  264 |   'Edit note',
  265 |   'Add Comment',
  266 |   '01 - General',
  267 |   '02 - Architectural',
  268 |   '03 - Structural',
  269 |   'Level 2 Framing Plan',
  270 |   'Roof Framing Plan',
  271 |   'South Elevation',
  272 |   'East Elevation',
  273 |   'Typical Sections',
  274 |   '04 - MEP',
  275 |   '05 - Site',
  276 |   '06 - Inspections',
  277 |   'Photos & Documents',
  278 |   'Site Photo Set',
  279 | ] as const;
  280 | 
  281 | test.describe('Visual Workspace pressable control coverage', () => {
  282 |   for (const [testId, label] of toolbarButtons) {
  283 |     test(`toolbar button ${label} is pressable without crashing`, async ({ page }) => {
  284 |       await openWorkspace(page);
  285 |       await expectNoPageErrors(page, async () => {
  286 |         await page.getByTestId(testId).click({ force: true });
  287 |       });
  288 |       await expect(page.getByTestId('status-message')).toBeVisible();
  289 |     });
  290 |   }
  291 | 
  292 |   for (const label of namedWorkspaceButtons) {
  293 |     test(`workspace button ${label} is pressable without crashing`, async ({ page }) => {
  294 |       await openWorkspace(page);
  295 |       await expectNoPageErrors(page, async () => {
  296 |         await page.getByRole('button', { name: label }).first().click({ force: true });
  297 |       });
  298 |       await expect(page.locator('body')).toBeVisible();
  299 |     });
  300 |   }
  301 | 
  302 |   test('all visible toolbar buttons expose test ids so missing tools are obvious', async ({ page }) => {
  303 |     await openWorkspace(page);
  304 |     for (const [testId] of toolbarButtons) {
  305 |       await expect(page.getByTestId(testId), `${testId} should exist`).toBeVisible();
  306 |     }
  307 |   });
  308 | 
  309 |   test('primary modal and panel buttons open the expected panels', async ({ page }) => {
  310 |     await openWorkspace(page);
  311 | 
  312 |     await page.getByTestId('tool-color').click();
  313 |     await expect(page.getByTestId('active-panel-title')).toContainText('Choose markup color');
  314 |     await page.getByTestId('close-active-panel').click();
  315 | 
  316 |     await page.getByTestId('tool-scale').click();
> 317 |     await expect(page.getByTestId('active-panel-title')).toContainText('Workspace settings');
      |                                                          ^ Error: expect(locator).toContainText(expected) failed
  318 |     await page.getByTestId('close-active-panel').click();
  319 | 
  320 |     await page.getByTestId('tool-note').click();
  321 |     await expect(page.getByTestId('active-panel-title')).toContainText('Add note');
  322 |     await page.getByTestId('close-active-panel').click();
  323 | 
  324 |     await page.getByTestId('tool-file').click();
  325 |     await expect(page.getByTestId('active-panel-title')).toContainText('Attach document');
  326 |     await page.getByTestId('close-active-panel').click();
  327 | 
  328 |     await page.getByRole('button', { name: 'Report' }).click();
  329 |     await expect(page.getByTestId('active-panel-title')).toContainText('Generate structural inspection report');
  330 |     await page.getByTestId('close-active-panel').click();
  331 | 
  332 |     await page.getByRole('button', { name: 'Export' }).click();
  333 |     await expect(page.getByTestId('active-panel-title')).toContainText('Export project deliverables');
  334 |   });
  335 | });
  336 | 
```