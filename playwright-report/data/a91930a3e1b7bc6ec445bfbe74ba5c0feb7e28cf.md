# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-workspace-tools.spec.ts >> Visual Workspace toolbar behavior >> Text tool prompts for text and creates actual text annotation
- Location: tests\visual-workspace-tools.spec.ts:111:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('FIELD NOTE TEST')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('FIELD NOTE TEST')

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
          - button "Text" [active] [ref=e80] [cursor=pointer]:
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
          - generic [ref=e476] [cursor=pointer]:
            - generic [ref=e479]: "2"
            - generic [ref=e482]: PAINT PEELING, RUST SC
            - generic [ref=e483]: FIELD VERIFY.
          - generic [ref=e484] [cursor=pointer]:
            - generic [ref=e487]: "3"
            - generic [ref=e490]: SECTION LOSS AT MIDSPA
            - generic [ref=e491]: FIELD VERIFY.
          - generic [ref=e492] [cursor=pointer]:
            - generic [ref=e495]: "4"
            - generic [ref=e498]: SURFACE RUST
            - generic [ref=e499]: FIELD VERIFY.
          - generic [ref=e500] [cursor=pointer]:
            - generic [ref=e503]: "5"
            - generic [ref=e506]: NO VISIBLE DISTRESS
            - generic [ref=e507]: FIELD VERIFY.
          - generic [ref=e508] [cursor=pointer]:
            - generic [ref=e511]: "6"
            - generic [ref=e512]: TEXT NOTE
        - generic:
          - button "Annotation 1"
          - button "Annotation 2"
          - button "Annotation 3"
          - button "Annotation 4"
          - button "Annotation 5"
          - button "Annotation 6"
      - generic [ref=e520]:
        - generic [ref=e521]:
          - generic [ref=e522]:
            - text: Items / Markup Schedule
            - img [ref=e523]
          - table [ref=e526]:
            - rowgroup [ref=e527]:
              - row "ID Type Item Name Location Status Condition Priority Discipline Due Date" [ref=e528]:
                - columnheader "ID" [ref=e529]
                - columnheader "Type" [ref=e530]
                - columnheader "Item Name" [ref=e531]
                - columnheader "Location" [ref=e532]
                - columnheader "Status" [ref=e533]
                - columnheader "Condition" [ref=e534]
                - columnheader "Priority" [ref=e535]
                - columnheader "Discipline" [ref=e536]
                - columnheader "Due Date" [ref=e537]
            - rowgroup [ref=e538]:
              - row "1 Beam B12 Grid 6 / A-B Field Verify Corrosion at seat connection High Structural May 26, 2025" [ref=e539] [cursor=pointer]:
                - cell "1" [ref=e540]: "1"
                - cell "Beam" [ref=e542]
                - cell "B12" [ref=e543]
                - cell "Grid 6 / A-B" [ref=e544]
                - cell "Field Verify" [ref=e545]
                - cell "Corrosion at seat connection" [ref=e546]
                - cell "High" [ref=e547]
                - cell "Structural" [ref=e548]
                - cell "May 26, 2025" [ref=e549]
              - row "2 Beam B18 Grid 6 / B-C Field Verify Paint peeling, rust scale Medium Structural May 26, 2025" [ref=e550] [cursor=pointer]:
                - cell "2" [ref=e551]: "2"
                - cell "Beam" [ref=e553]
                - cell "B18" [ref=e554]
                - cell "Grid 6 / B-C" [ref=e555]
                - cell "Field Verify" [ref=e556]
                - cell "Paint peeling, rust scale" [ref=e557]
                - cell "Medium" [ref=e558]
                - cell "Structural" [ref=e559]
                - cell "May 26, 2025" [ref=e560]
              - row "3 Beam B31 Grid 5 / C-D Field Verify Section loss at midspan High Structural May 26, 2025" [ref=e561] [cursor=pointer]:
                - cell "3" [ref=e562]: "3"
                - cell "Beam" [ref=e564]
                - cell "B31" [ref=e565]
                - cell "Grid 5 / C-D" [ref=e566]
                - cell "Field Verify" [ref=e567]
                - cell "Section loss at midspan" [ref=e568]
                - cell "High" [ref=e569]
                - cell "Structural" [ref=e570]
                - cell "May 26, 2025" [ref=e571]
              - row "4 Column C16 Grid 5 / B-C Monitor Surface rust Low Structural Jun 10, 2025" [ref=e572] [cursor=pointer]:
                - cell "4" [ref=e573]: "4"
                - cell "Column" [ref=e575]
                - cell "C16" [ref=e576]
                - cell "Grid 5 / B-C" [ref=e577]
                - cell "Monitor" [ref=e578]
                - cell "Surface rust" [ref=e579]
                - cell "Low" [ref=e580]
                - cell "Structural" [ref=e581]
                - cell "Jun 10, 2025" [ref=e582]
              - row "5 Beam B7 Grid 2 / A-B Complete No visible distress Low Structural —" [ref=e583] [cursor=pointer]:
                - cell "5" [ref=e584]: "5"
                - cell "Beam" [ref=e586]
                - cell "B7" [ref=e587]
                - cell "Grid 2 / A-B" [ref=e588]
                - cell "Complete" [ref=e589]
                - cell "No visible distress" [ref=e590]
                - cell "Low" [ref=e591]
                - cell "Structural" [ref=e592]
                - cell "—" [ref=e593]
              - row "6 Text N6 Marked on board Field Verify TEXT NOTE Medium Structural TBD" [ref=e594] [cursor=pointer]:
                - cell "6" [ref=e595]: "6"
                - cell "Text" [ref=e597]
                - cell "N6" [ref=e598]
                - cell "Marked on board" [ref=e599]
                - cell "Field Verify" [ref=e600]
                - cell "TEXT NOTE" [ref=e601]
                - cell "Medium" [ref=e602]
                - cell "Structural" [ref=e603]
                - cell "TBD" [ref=e604]
          - generic [ref=e605]: 1–6 of 6 items
        - generic [ref=e606]:
          - generic [ref=e607]:
            - text: Relationship Map / Blueprint
            - generic [ref=e608]: Click nodes to inspect links
          - generic [ref=e609]:
            - img [ref=e610]:
              - generic [ref=e615]: refers to
              - generic [ref=e619]: has
              - generic [ref=e623]: impacts
              - generic [ref=e627]: relates
              - generic [ref=e631]: referenced by
            - 'button "Plan Marker #6 Location" [ref=e632] [cursor=pointer]':
              - generic [ref=e633]: "Plan Marker #6"
              - generic [ref=e634]: Location
            - button "6 Text N6 Project Item" [ref=e635] [cursor=pointer]:
              - generic [ref=e636]: "6"
              - generic [ref=e637]: Text N6
              - generic [ref=e638]: Project Item
            - button "Site Photos (0) Photo Set" [ref=e639] [cursor=pointer]:
              - generic [ref=e640]: Site Photos (0)
              - generic [ref=e641]: Photo Set
            - button "Board Markups (1) Board Annotations" [ref=e642] [cursor=pointer]:
              - generic [ref=e643]: Board Markups (1)
              - generic [ref=e644]: Board Annotations
            - button "Cost Item C-208 Cost" [ref=e645] [cursor=pointer]:
              - generic [ref=e646]: Cost Item C-208
              - generic [ref=e647]: Cost
            - button "Document S-4.1 Document" [ref=e648] [cursor=pointer]:
              - generic [ref=e649]: Document S-4.1
              - generic [ref=e650]: Document
            - generic [ref=e651]:
              - generic [ref=e652]: Selected Blueprint Node
              - generic [ref=e653]: Board Markups (1)
              - generic [ref=e654]: Board Annotations
              - generic [ref=e655]:
                - generic [ref=e656]:
                  - generic [ref=e657]: Links
                  - generic [ref=e658]: "1"
                - generic [ref=e659]:
                  - generic [ref=e660]: Count
                  - generic [ref=e661]: "1"
              - generic [ref=e662]:
                - generic [ref=e663]: Details
                - generic [ref=e664]: TEXT NOTE
            - generic [ref=e665]:
              - button "−" [ref=e666] [cursor=pointer]
              - generic [ref=e667]: 100%
              - button "+" [ref=e668] [cursor=pointer]
              - button [ref=e669] [cursor=pointer]:
                - img [ref=e670]
    - complementary [ref=e675]:
      - generic [ref=e676]:
        - heading "Site Photos" [level=2] [ref=e677]
        - generic [ref=e678]:
          - button "Filter linked photos" [ref=e679] [cursor=pointer]:
            - img [ref=e680]
          - button "Collapse photos panel" [ref=e682] [cursor=pointer]:
            - img [ref=e683]
      - generic [ref=e686]:
        - button "1 P101_0456.JPG May 11, 2025 Grid 6 / A-B" [ref=e687] [cursor=pointer]:
          - generic [ref=e688]:
            - img [ref=e689]
            - generic [ref=e706]: "1"
          - generic [ref=e707]:
            - generic [ref=e708]:
              - generic [ref=e709]: P101_0456.JPG
              - generic [ref=e710]: May 11, 2025
            - generic [ref=e711]: Grid 6 / A-B
        - button "2 P101_0461.JPG May 11, 2025 Grid 6 / B-C" [ref=e712] [cursor=pointer]:
          - generic [ref=e713]:
            - img [ref=e714]
            - generic [ref=e731]: "2"
          - generic [ref=e732]:
            - generic [ref=e733]:
              - generic [ref=e734]: P101_0461.JPG
              - generic [ref=e735]: May 11, 2025
            - generic [ref=e736]: Grid 6 / B-C
        - button "3 P101_0468.JPG May 11, 2025 Grid 5 / C-D" [ref=e737] [cursor=pointer]:
          - generic [ref=e738]:
            - img [ref=e739]
            - generic [ref=e756]: "3"
          - generic [ref=e757]:
            - generic [ref=e758]:
              - generic [ref=e759]: P101_0468.JPG
              - generic [ref=e760]: May 11, 2025
            - generic [ref=e761]: Grid 5 / C-D
        - button "View all photos (5)" [ref=e762] [cursor=pointer]
    - complementary [ref=e763]:
      - generic [ref=e764]:
        - heading "Inspector" [level=2] [ref=e765]
        - button [ref=e766] [cursor=pointer]:
          - img [ref=e767]
      - generic [ref=e770]:
        - generic [ref=e771]:
          - generic [ref=e772]:
            - generic [ref=e773]:
              - generic [ref=e774]: "6"
              - heading "Text N6" [level=2] [ref=e776]
            - button "Field Verify" [ref=e777] [cursor=pointer]:
              - text: Field Verify
              - img [ref=e778]
          - generic [ref=e780]:
            - generic [ref=e781]:
              - generic [ref=e782]: Item Name
              - generic [ref=e783]: Text N6
            - generic [ref=e784]:
              - generic [ref=e785]: Type
              - generic [ref=e786]: Text
            - generic [ref=e787]:
              - generic [ref=e788]: Status
              - button "Field Verify" [ref=e790] [cursor=pointer]
            - generic [ref=e791]:
              - generic [ref=e792]: Section
              - generic [ref=e793]: TBD
            - generic [ref=e794]:
              - generic [ref=e795]: Location
              - generic [ref=e796]: Marked on board
            - generic [ref=e797]:
              - generic [ref=e798]: Elevation
              - generic [ref=e799]: +14&apos;-0&quot; (T.O.S.)
            - generic [ref=e800]:
              - generic [ref=e801]: Condition
              - button "TEXT NOTE" [ref=e803] [cursor=pointer]
            - generic [ref=e804]:
              - generic [ref=e805]: Priority
              - button "Medium" [ref=e807] [cursor=pointer]
            - generic [ref=e808]:
              - generic [ref=e809]: Discipline
              - generic [ref=e810]: Structural
            - generic [ref=e811]:
              - generic [ref=e812]: Created By
              - generic [ref=e813]: A. Morgan
            - generic [ref=e814]:
              - generic [ref=e815]: Date
              - generic [ref=e816]: May 12, 2025
        - generic [ref=e817]:
          - button "Linked Photos 0" [ref=e818] [cursor=pointer]:
            - generic [ref=e819]:
              - img [ref=e820]
              - text: Linked Photos
            - generic [ref=e823]:
              - text: "0"
              - img [ref=e824]
          - button "Linked Documents 0" [ref=e826] [cursor=pointer]:
            - generic [ref=e827]:
              - img [ref=e828]
              - text: Linked Documents
            - generic [ref=e831]:
              - text: "0"
              - img [ref=e832]
          - button "Board Markups 1" [ref=e834] [cursor=pointer]:
            - generic [ref=e835]:
              - img [ref=e836]
              - text: Board Markups
            - generic [ref=e839]:
              - text: "1"
              - img [ref=e840]
          - button "Linked Costs 1" [ref=e842] [cursor=pointer]:
            - generic [ref=e843]:
              - img [ref=e844]
              - text: Linked Costs
            - generic [ref=e847]:
              - text: "1"
              - img [ref=e848]
        - generic [ref=e851]:
          - heading "Linked Photos (0)" [level=3] [ref=e852]
          - button [ref=e853] [cursor=pointer]:
            - img [ref=e854]
        - generic [ref=e855]:
          - generic [ref=e856]:
            - heading "Notes" [level=3] [ref=e857]
            - button "Edit note" [ref=e858] [cursor=pointer]:
              - img [ref=e859]
          - button "Text note created from board markup." [ref=e861] [cursor=pointer]
          - generic [ref=e862]: A. Morgan, May 12, 2025 9:15 AM
        - generic [ref=e863]:
          - generic [ref=e864]:
            - heading "Comments (0)" [level=3] [ref=e865]
            - img [ref=e866]
          - textbox "Add engineering note or reply..." [ref=e868]
          - button "Add Comment" [ref=e869] [cursor=pointer]
        - generic [ref=e870]:
          - generic [ref=e871]:
            - heading "Issue Details" [level=3] [ref=e872]
            - img [ref=e873]
          - generic [ref=e875]:
            - generic [ref=e876]:
              - generic [ref=e877]: Issue Type
              - generic [ref=e878]: Section Loss
            - generic [ref=e879]:
              - generic [ref=e880]: Severity
              - generic [ref=e881]: Moderate
            - generic [ref=e882]:
              - generic [ref=e883]: Recommendation
              - generic [ref=e884]: Repair
            - generic [ref=e885]:
              - generic [ref=e886]: Recommended Action
              - generic [ref=e887]: Grind, repair, prime and repaint
            - generic [ref=e888]:
              - generic [ref=e889]: Due Date
              - generic [ref=e890]: TBD
  - contentinfo [ref=e891]:
    - generic [ref=e892]: Text tool active. Use the board canvas to place or edit this markup.
    - generic [ref=e893]: "X: 152'-3 1/2\" Y: 47'-6 3/4\" | Plan: 100% / Map: 100% | Grid: 1'-0\" ● Online"
```

# Test source

```ts
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
  80  | test.describe('Visual Workspace toolbar behavior', () => {
  81  |   test.beforeEach(async ({ page }) => {
  82  |     await openWorkspace(page);
  83  |   });
  84  | 
  85  |   test('Select only selects an annotation and does not move it on click', async ({ page }) => {
  86  |     await page.getByTestId('tool-select').click();
  87  | 
  88  |     const annotation = await annotationLocator(page, 1);
  89  |     const before = await getBox(annotation);
  90  | 
  91  |     await clickAnnotation(page, 1);
  92  |     await expect(page.getByTestId('inspector-title')).toContainText(/B12|N1|Text|Beam/);
  93  | 
  94  |     const after = await getBox(annotation);
  95  |     expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  96  |     expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  97  |   });
  98  | 
  99  |   test('Cloud tool creates a new annotation from a drag', async ({ page }) => {
  100 |     const before = await annotationCount(page);
  101 | 
  102 |     await page.getByTestId('tool-cloud').click();
  103 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Cloud');
  104 | 
  105 |     await dragOnCanvas(page, { x: 360, y: 180 }, { x: 560, y: 260 });
  106 | 
  107 |     await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
  108 |     await expect(page.getByTestId('inspector-title')).toBeVisible();
  109 |   });
  110 | 
  111 |   test('Text tool prompts for text and creates actual text annotation', async ({ page }) => {
  112 |     const before = await annotationCount(page);
  113 | 
  114 |     page.once('dialog', async (dialog) => {
  115 |       expect(dialog.type()).toBe('prompt');
  116 |       await dialog.accept('FIELD NOTE TEST');
  117 |     });
  118 | 
  119 |     await page.getByTestId('tool-text').click();
  120 |     await dragOnCanvas(page, { x: 420, y: 210 }, { x: 620, y: 260 });
  121 | 
  122 |     await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
> 123 |     await expect(page.getByText('FIELD NOTE TEST')).toBeVisible();
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  124 |   });
  125 | 
  126 |   test('Eraser is a mode and erases the clicked annotation only', async ({ page }) => {
  127 |     const before = await annotationCount(page);
  128 | 
  129 |     await page.getByTestId('tool-eraser').click();
  130 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
  131 | 
  132 |     await clickAnnotation(page, 1);
  133 | 
  134 |     await expect.poll(() => annotationCount(page)).toBe(before - 1);
  135 |     await expect(page.getByTestId('plan-canvas')).toBeVisible();
  136 |   });
  137 | 
  138 |   test('Escape cancels active tool back to Select', async ({ page }) => {
  139 |     await page.getByTestId('tool-eraser').click();
  140 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
  141 | 
  142 |     await page.keyboard.press('Escape');
  143 | 
  144 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  145 |   });
  146 | 
  147 |   test('Pan moves the view and Fit resets it', async ({ page }) => {
  148 |     const transform = page.getByTestId('plan-transform');
  149 | 
  150 |     await page.getByTestId('tool-pan').click();
  151 |     await dragOnCanvas(page, { x: 360, y: 240 }, { x: 440, y: 300 });
  152 | 
  153 |     await expect(transform).not.toHaveAttribute('data-plan-pan-x', '0');
  154 | 
  155 |     await page.getByTestId('tool-fit').click();
  156 | 
  157 |     await expect(transform).toHaveAttribute('data-plan-zoom', '1');
  158 |     await expect(transform).toHaveAttribute('data-plan-pan-x', '0');
  159 |     await expect(transform).toHaveAttribute('data-plan-pan-y', '0');
  160 |   });
  161 | 
  162 |   test('Zoom mode uses wheel and Escape cancels', async ({ page }) => {
  163 |     const transform = page.getByTestId('plan-transform');
  164 |     await expect(transform).toHaveAttribute('data-plan-zoom', '1');
  165 | 
  166 |     await page.getByTestId('tool-zoom').click();
  167 |     await wheelCanvas(page, -400);
  168 |     await wheelCanvas(page, -400);
  169 | 
  170 |     await expect(transform).not.toHaveAttribute('data-plan-zoom', '1');
  171 | 
  172 |     await page.keyboard.press('Escape');
  173 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  174 |   });
  175 | 
  176 |   test('Color opens palette and changes selected annotation color', async ({ page }) => {
  177 |     await page.getByTestId('tool-select').click();
  178 |     await clickAnnotation(page, 1);
  179 | 
  180 |     await page.getByTestId('tool-color').click();
  181 |     await expect(page.getByTestId('active-panel-title')).toContainText('Choose markup color');
  182 |   });
  183 | 
  184 |   test('Photo, File, and Note tools open their panels', async ({ page }) => {
  185 |     await page.getByTestId('tool-photo').click();
  186 |     await expect(page.getByTestId('active-panel-title')).toContainText('Add or choose site photo');
  187 |     await page.getByTestId('close-active-panel').click();
  188 | 
  189 |     await page.getByTestId('tool-file').click();
  190 |     await expect(page.getByTestId('active-panel-title')).toContainText('Attach document');
  191 |     await page.getByTestId('close-active-panel').click();
  192 | 
  193 |     await page.getByTestId('tool-note').click();
  194 |     await expect(page.getByTestId('active-panel-title')).toContainText('Add note');
  195 |   });
  196 | 
  197 |   test('View all photos opens photo library', async ({ page }) => {
  198 |     await page.getByTestId('view-all-photos').click();
  199 |     await expect(page.getByTestId('photo-library-title')).toBeVisible();
  200 |   });
  201 | 
  202 |   test('Distance requires scale first', async ({ page }) => {
  203 |     const before = await annotationCount(page);
  204 | 
  205 |     await page.getByTestId('tool-distance').click();
  206 |     await dragOnCanvas(page, { x: 300, y: 200 }, { x: 470, y: 200 });
  207 | 
  208 |     await expect.poll(() => annotationCount(page)).toBe(before);
  209 |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Distance');
  210 |   });
  211 | });
  212 | 
```