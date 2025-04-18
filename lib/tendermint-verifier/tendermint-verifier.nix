_: {
  perSystem =
    {
      self',
      pkgs,
      system,
      config,
      crane,
      stdenv,
      dbg,
      lib,
      ...
    }:
    let
      tendermintVerifierTestSuite = crane.buildWorkspaceMember {
        crateDirFromRoot = "lib/tendermint-verifier";
      };
    in
    {
      inherit (tendermintVerifierTestSuite) checks;
    };
}
