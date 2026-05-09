# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-workspace-tools.spec.ts >> Visual Workspace pressable control coverage >> workspace button Collapse photos panel is pressable without crashing
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
        - button "Photos" [ref=e37] [cursor=pointer]
        - generic [ref=e38]: AM
    - generic [ref=e39]:
      - generic [ref=e40]:
        - generic [ref=e41]:
          - button "Select" [ref=e42] [cursor=pointer]:
            - img [ref=e43]
            - generic [ref=e45]: Select
          - button "Pan" [ref=e46] [cursor=pointer]:
            - img [ref=e47]
            - generic [ref=e52]: Pan
          - button "Zoom" [ref=e53] [cursor=pointer]:
            - img [ref=e54]
            - generic [ref=e57]: Zoom
          - button "Fit" [ref=e58] [cursor=pointer]:
            - img [ref=e59]
            - generic [ref=e64]: Fit
          - button "Zoom Area" [ref=e65] [cursor=pointer]:
            - img [ref=e66]
            - generic [ref=e69]: Zoom Area
        - generic [ref=e70]: Navigate
      - generic [ref=e71]:
        - generic [ref=e72]:
          - button "Arrow" [ref=e73] [cursor=pointer]:
            - img [ref=e74]
            - generic [ref=e76]: Arrow
          - button "Cloud" [ref=e77] [cursor=pointer]:
            - img [ref=e78]
            - generic [ref=e80]: Cloud
          - button "Text" [ref=e81] [cursor=pointer]:
            - img [ref=e82]
            - generic [ref=e84]: Text
          - button "Box" [ref=e85] [cursor=pointer]:
            - img [ref=e86]
            - generic [ref=e88]: Box
          - button "Callout" [ref=e89] [cursor=pointer]:
            - img [ref=e90]
            - generic [ref=e92]: Callout
          - button "Dimension" [ref=e93] [cursor=pointer]:
            - img [ref=e94]
            - generic [ref=e100]: Dimension
        - generic [ref=e101]: Markup
      - generic [ref=e102]:
        - generic [ref=e103]:
          - button "Distance" [ref=e104] [cursor=pointer]:
            - img [ref=e105]
            - generic [ref=e111]: Distance
          - button "Angle" [ref=e112] [cursor=pointer]:
            - img [ref=e113]
            - generic [ref=e115]: Angle
          - button "Area" [ref=e116] [cursor=pointer]:
            - img [ref=e117]
            - generic [ref=e119]: Area
        - generic [ref=e120]: Measure
      - generic [ref=e121]:
        - generic [ref=e122]:
          - button "Note" [ref=e123] [cursor=pointer]:
            - img [ref=e124]
            - generic [ref=e127]: Note
          - button "Photo" [ref=e128] [cursor=pointer]:
            - img [ref=e129]
            - generic [ref=e132]: Photo
          - button "File" [ref=e133] [cursor=pointer]:
            - img [ref=e134]
            - generic [ref=e137]: File
          - button "Link" [ref=e138] [cursor=pointer]:
            - img [ref=e139]
            - generic [ref=e142]: Link
        - generic [ref=e143]: Insert
      - generic [ref=e144]:
        - generic [ref=e145]:
          - button "Highlighter" [ref=e146] [cursor=pointer]:
            - img [ref=e147]
            - generic [ref=e150]: Highlighter
          - button "Pen" [ref=e151] [cursor=pointer]:
            - img [ref=e152]
            - generic [ref=e154]: Pen
          - button "Eraser" [ref=e155] [cursor=pointer]:
            - img [ref=e156]
            - generic [ref=e158]: Eraser
          - button "Color" [ref=e159] [cursor=pointer]:
            - img [ref=e160]
            - generic [ref=e166]: Color
        - generic [ref=e167]: Annotate
      - generic [ref=e168]:
        - generic [ref=e169]:
          - button "Layers" [ref=e170] [cursor=pointer]:
            - img [ref=e171]
            - generic [ref=e175]: Layers
          - button "Scale" [ref=e176] [cursor=pointer]:
            - img [ref=e177]
            - generic [ref=e183]: Scale
          - button "Grid" [ref=e184] [cursor=pointer]:
            - img [ref=e185]
            - generic [ref=e187]: Grid
          - button "Snap" [ref=e188] [cursor=pointer]:
            - img [ref=e189]
            - generic [ref=e192]: Snap
        - generic [ref=e193]: Layers
      - generic [ref=e194]:
        - generic [ref=e195]:
          - button "Undo" [ref=e196] [cursor=pointer]:
            - img [ref=e197]
            - generic [ref=e200]: Undo
          - button "Redo" [ref=e201] [cursor=pointer]:
            - img [ref=e202]
            - generic [ref=e205]: Redo
          - button "More" [ref=e206] [cursor=pointer]:
            - img [ref=e207]
            - generic [ref=e211]: More
        - generic [ref=e212]: Edit
  - generic [ref=e213]:
    - complementary [ref=e214]:
      - generic [ref=e215]:
        - generic [ref=e216]:
          - generic [ref=e217]: Project
          - button [ref=e218] [cursor=pointer]:
            - img [ref=e219]
        - generic [ref=e223]: 1234 - Riverside Office Building
      - generic [ref=e224]:
        - generic [ref=e225]:
          - heading "Boards" [level=2] [ref=e226]
          - button "Add board" [ref=e227] [cursor=pointer]:
            - img [ref=e228]
        - generic [ref=e229]:
          - img [ref=e230]
          - textbox [ref=e233]:
            - /placeholder: Search boards...
      - generic [ref=e234]:
        - button "01 - General" [ref=e236] [cursor=pointer]:
          - img [ref=e237]
          - img [ref=e239]
          - generic [ref=e242]: 01 - General
        - button "02 - Architectural" [ref=e244] [cursor=pointer]:
          - img [ref=e245]
          - img [ref=e247]
          - generic [ref=e250]: 02 - Architectural
        - generic [ref=e251]:
          - button "03 - Structural" [ref=e252] [cursor=pointer]:
            - img [ref=e253]
            - img [ref=e255]
            - generic [ref=e258]: 03 - Structural
          - button "Level 2 Framing Plan" [ref=e259] [cursor=pointer]:
            - img [ref=e260]
            - generic [ref=e263]: Level 2 Framing Plan
          - button "Roof Framing Plan" [ref=e265] [cursor=pointer]:
            - img [ref=e266]
            - generic [ref=e269]: Roof Framing Plan
          - button "South Elevation" [ref=e270] [cursor=pointer]:
            - img [ref=e271]
            - generic [ref=e274]: South Elevation
          - button "East Elevation" [ref=e275] [cursor=pointer]:
            - img [ref=e276]
            - generic [ref=e279]: East Elevation
          - button "Typical Sections" [ref=e280] [cursor=pointer]:
            - img [ref=e281]
            - generic [ref=e284]: Typical Sections
        - button "04 - MEP" [ref=e286] [cursor=pointer]:
          - img [ref=e287]
          - img [ref=e289]
          - generic [ref=e292]: 04 - MEP
        - button "05 - Site" [ref=e294] [cursor=pointer]:
          - img [ref=e295]
          - img [ref=e297]
          - generic [ref=e300]: 05 - Site
        - button "06 - Inspections" [ref=e302] [cursor=pointer]:
          - img [ref=e303]
          - img [ref=e305]
          - generic [ref=e308]: 06 - Inspections
        - generic [ref=e309]:
          - button "Photos & Documents" [ref=e310] [cursor=pointer]:
            - img [ref=e311]
            - img [ref=e313]
            - generic [ref=e316]: Photos & Documents
          - button "Site Photo Set" [ref=e317] [cursor=pointer]:
            - img [ref=e318]
            - generic [ref=e321]: Site Photo Set
      - generic [ref=e322]:
        - generic [ref=e323]:
          - generic [ref=e324]: Layers
          - img [ref=e325]
        - button "● Plan Grid" [ref=e327] [cursor=pointer]:
          - generic [ref=e328]:
            - generic [ref=e329]: ●
            - text: Plan Grid
        - button "● Structural - Beams" [ref=e330] [cursor=pointer]:
          - generic [ref=e331]:
            - generic [ref=e332]: ●
            - text: Structural - Beams
        - button "● Structural - Columns" [ref=e333] [cursor=pointer]:
          - generic [ref=e334]:
            - generic [ref=e335]: ●
            - text: Structural - Columns
        - button "● Dimensions" [ref=e336] [cursor=pointer]:
          - generic [ref=e337]:
            - generic [ref=e338]: ●
            - text: Dimensions
        - button "● Markups" [ref=e339] [cursor=pointer]:
          - generic [ref=e340]:
            - generic [ref=e341]: ●
            - text: Markups
          - img [ref=e342]
        - button "● Notes" [ref=e344] [cursor=pointer]:
          - generic [ref=e345]:
            - generic [ref=e346]: ●
            - text: Notes
        - button "● Photos" [ref=e347] [cursor=pointer]:
          - generic [ref=e348]:
            - generic [ref=e349]: ●
            - text: Photos
        - button "◌ Reference" [ref=e350] [cursor=pointer]:
          - generic [ref=e351]:
            - generic [ref=e352]: ◌
            - text: Reference
    - main [ref=e353]:
      - generic [ref=e354]:
        - generic [ref=e355]:
          - text: Level 2 Framing Plan
          - button "Reset active board" [ref=e356] [cursor=pointer]:
            - img [ref=e357]
        - button [ref=e360] [cursor=pointer]:
          - img [ref=e361]
      - generic [ref=e363]:
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
          - generic [ref=e468]:
            - generic [ref=e471]: "1"
            - generic [ref=e474]: CORROSION AT SEAT CONN
            - generic [ref=e475]: FIELD VERIFY.
          - generic [ref=e483]:
            - generic [ref=e486]: "2"
            - generic [ref=e489]: PAINT PEELING, RUST SC
            - generic [ref=e490]: FIELD VERIFY.
          - generic [ref=e491]:
            - generic [ref=e494]: "3"
            - generic [ref=e497]: SECTION LOSS AT MIDSPA
            - generic [ref=e498]: FIELD VERIFY.
          - generic [ref=e499]:
            - generic [ref=e502]: "4"
            - generic [ref=e505]: SURFACE RUST
            - generic [ref=e506]: FIELD VERIFY.
          - generic [ref=e507]:
            - generic [ref=e510]: "5"
            - generic [ref=e513]: NO VISIBLE DISTRESS
            - generic [ref=e514]: FIELD VERIFY.
        - generic:
          - button "Annotation 1" [ref=e515] [cursor=pointer]
          - button "Annotation 2" [ref=e516] [cursor=pointer]
          - button "Annotation 3" [ref=e517] [cursor=pointer]
          - button "Annotation 4" [ref=e518] [cursor=pointer]
          - button "Annotation 5" [ref=e519] [cursor=pointer]
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
          - generic [ref=e594]: 1–5 of 5 items
        - generic [ref=e595]:
          - generic [ref=e596]:
            - text: Relationship Map / Blueprint
            - generic [ref=e597]: Click nodes to inspect links
          - generic [ref=e598]:
            - img [ref=e599]:
              - generic [ref=e604]: refers to
              - generic [ref=e608]: has
              - generic [ref=e612]: impacts
              - generic [ref=e616]: relates
              - generic [ref=e620]: referenced by
            - 'button "Plan Marker #1 Location" [ref=e621] [cursor=pointer]':
              - generic [ref=e622]: "Plan Marker #1"
              - generic [ref=e623]: Location
            - button "1 Beam B12 Project Item" [ref=e624] [cursor=pointer]:
              - generic [ref=e625]: "1"
              - generic [ref=e626]: Beam B12
              - generic [ref=e627]: Project Item
            - button "Site Photos (3) Photo Set" [ref=e628] [cursor=pointer]:
              - generic [ref=e629]: Site Photos (3)
              - generic [ref=e630]: Photo Set
            - button "Board Markups (1) Board Annotations" [ref=e631] [cursor=pointer]:
              - generic [ref=e632]: Board Markups (1)
              - generic [ref=e633]: Board Annotations
            - button "Cost Item C-102 Cost" [ref=e634] [cursor=pointer]:
              - generic [ref=e635]: Cost Item C-102
              - generic [ref=e636]: Cost
            - button "Document S-2.3 Document" [ref=e637] [cursor=pointer]:
              - generic [ref=e638]: Document S-2.3
              - generic [ref=e639]: Document
            - generic [ref=e640]:
              - generic [ref=e641]: Selected Blueprint Node
              - generic [ref=e642]: Beam B12
              - generic [ref=e643]: Project Item
              - generic [ref=e644]:
                - generic [ref=e645]:
                  - generic [ref=e646]: Links
                  - generic [ref=e647]: "4"
                - generic [ref=e648]:
                  - generic [ref=e649]: Count
                  - generic [ref=e650]: "1"
              - generic [ref=e651]:
                - generic [ref=e652]: Details
                - generic [ref=e653]: W16x26
            - generic [ref=e654]:
              - button "−" [ref=e655] [cursor=pointer]
              - generic [ref=e656]: 100%
              - button "+" [ref=e657] [cursor=pointer]
              - button [ref=e658] [cursor=pointer]:
                - img [ref=e659]
    - complementary [ref=e664]:
      - generic [ref=e665]:
        - heading "Inspector" [level=2] [ref=e666]
        - button [ref=e667] [cursor=pointer]:
          - img [ref=e668]
      - generic [ref=e671]:
        - generic [ref=e672]:
          - generic [ref=e673]:
            - generic [ref=e674]:
              - generic [ref=e675]: "1"
              - heading "Beam B12" [level=2] [ref=e677]
            - button "Field Verify" [ref=e678] [cursor=pointer]:
              - text: Field Verify
              - img [ref=e679]
          - generic [ref=e681]:
            - generic [ref=e682]:
              - generic [ref=e683]: Item Name
              - generic [ref=e684]: Beam B12
            - generic [ref=e685]:
              - generic [ref=e686]: Type
              - generic [ref=e687]: Steel Beam
            - generic [ref=e688]:
              - generic [ref=e689]: Status
              - button "Field Verify" [ref=e691] [cursor=pointer]
            - generic [ref=e692]:
              - generic [ref=e693]: Section
              - generic [ref=e694]: W16x26
            - generic [ref=e695]:
              - generic [ref=e696]: Location
              - generic [ref=e697]: Grid 6 / A-B
            - generic [ref=e698]:
              - generic [ref=e699]: Elevation
              - generic [ref=e700]: +14&apos;-0&quot; (T.O.S.)
            - generic [ref=e701]:
              - generic [ref=e702]: Condition
              - button "Corrosion at seat connection" [ref=e704] [cursor=pointer]
            - generic [ref=e705]:
              - generic [ref=e706]: Priority
              - button "High" [ref=e708] [cursor=pointer]
            - generic [ref=e709]:
              - generic [ref=e710]: Discipline
              - generic [ref=e711]: Structural
            - generic [ref=e712]:
              - generic [ref=e713]: Created By
              - generic [ref=e714]: A. Morgan
            - generic [ref=e715]:
              - generic [ref=e716]: Date
              - generic [ref=e717]: May 12, 2025
        - generic [ref=e718]:
          - button "Linked Photos 3" [ref=e719] [cursor=pointer]:
            - generic [ref=e720]:
              - img [ref=e721]
              - text: Linked Photos
            - generic [ref=e724]:
              - text: "3"
              - img [ref=e725]
          - button "Linked Documents 2" [ref=e727] [cursor=pointer]:
            - generic [ref=e728]:
              - img [ref=e729]
              - text: Linked Documents
            - generic [ref=e732]:
              - text: "2"
              - img [ref=e733]
          - button "Board Markups 1" [ref=e735] [cursor=pointer]:
            - generic [ref=e736]:
              - img [ref=e737]
              - text: Board Markups
            - generic [ref=e740]:
              - text: "1"
              - img [ref=e741]
          - button "Linked Costs 1" [ref=e743] [cursor=pointer]:
            - generic [ref=e744]:
              - img [ref=e745]
              - text: Linked Costs
            - generic [ref=e748]:
              - text: "1"
              - img [ref=e749]
        - generic [ref=e751]:
          - generic [ref=e752]:
            - heading "Linked Photos (3)" [level=3] [ref=e753]
            - button [ref=e754] [cursor=pointer]:
              - img [ref=e755]
          - generic [ref=e756]:
            - generic [ref=e757]:
              - img [ref=e759]
              - generic [ref=e776]:
                - generic [ref=e777]: P101_0456.JPG
                - generic [ref=e778]: May 11, 2025
                - generic [ref=e779]: Grid 6 / A-B
            - generic [ref=e780]:
              - img [ref=e782]
              - generic [ref=e799]:
                - generic [ref=e800]: P101_0457.JPG
                - generic [ref=e801]: May 11, 2025
                - generic [ref=e802]: Grid 6 / A-B
        - generic [ref=e803]:
          - generic [ref=e804]:
            - heading "Notes" [level=3] [ref=e805]
            - button "Edit note" [ref=e806] [cursor=pointer]:
              - img [ref=e807]
          - button "Seat angle connection shows heavy rust and section loss. Verify seat and bearing stiffener condition." [ref=e809] [cursor=pointer]
          - generic [ref=e810]: A. Morgan, May 12, 2025 9:15 AM
        - generic [ref=e811]:
          - generic [ref=e812]:
            - heading "Comments (1)" [level=3] [ref=e813]
            - img [ref=e814]
          - generic [ref=e817]:
            - generic [ref=e818]:
              - generic [ref=e819]: A. Morgan
              - button "Open" [ref=e820] [cursor=pointer]
            - paragraph [ref=e821]: Verify seat angle thickness and bearing stiffener condition during follow-up visit.
            - generic [ref=e822]: May 12, 2025 9:15 AM
          - textbox "Add engineering note or reply..." [ref=e823]
          - button "Add Comment" [ref=e824] [cursor=pointer]
        - generic [ref=e825]:
          - generic [ref=e826]:
            - heading "Issue Details" [level=3] [ref=e827]
            - img [ref=e828]
          - generic [ref=e830]:
            - generic [ref=e831]:
              - generic [ref=e832]: Issue Type
              - generic [ref=e833]: Corrosion
            - generic [ref=e834]:
              - generic [ref=e835]: Severity
              - generic [ref=e836]: Severe
            - generic [ref=e837]:
              - generic [ref=e838]: Recommendation
              - generic [ref=e839]: Repair
            - generic [ref=e840]:
              - generic [ref=e841]: Recommended Action
              - generic [ref=e842]: Grind, repair, prime and repaint
            - generic [ref=e843]:
              - generic [ref=e844]: Due Date
              - generic [ref=e845]: May 26, 2025
  - contentinfo [ref=e846]:
    - generic [ref=e847]: Select active. Click a markup to select it and show properties. Use Eraser to delete, Pan to move the view, Esc cancels active tools.
    - generic [ref=e848]: "X: 152'-3 1/2\" Y: 47'-6 3/4\" | Plan: 100% / Map: 100% | Grid: 1'-0\" ● Online"
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