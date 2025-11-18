export function createLevelPaths(
    width: number,
    height: number,
): Map<string, Phaser.Curves.Path> {
    const paths = new Map<string, Phaser.Curves.Path>();

    const swoopLeft = new Phaser.Curves.Path(-50, 100).splineTo([
        new Phaser.Math.Vector2(200, 150),
        new Phaser.Math.Vector2(400, 50),
        new Phaser.Math.Vector2(600, 150),
    ]);
    paths.set("path_swoop_left", swoopLeft);

    const swoopRight = new Phaser.Curves.Path(width + 50, 100).splineTo([
        new Phaser.Math.Vector2(600, 150),
        new Phaser.Math.Vector2(400, 50),
        new Phaser.Math.Vector2(200, 150),
    ]);
    paths.set("path_swoop_right", swoopRight);

    const zigZag = new Phaser.Curves.Path(400, -50)
        .lineTo(400, 100)
        .lineTo(300, 150)
        .lineTo(500, 200);
    paths.set("path_zigzag", zigZag);

    const bossEntry = new Phaser.Curves.Path(width / 2, -150).lineTo(
        width / 2,
        150,
    );
    paths.set("path_boss_entry", bossEntry);

    return paths;
}
