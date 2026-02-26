package node.visitor;

import java.util.stream.Stream;

import node.DocumentNode;
import node.Node;
import node.RootNode;

public class Flattener implements NodeVisitor<Stream<Node>> {

	@Override
	public Stream<Node> visitDocumentNode(DocumentNode n) {
		return Stream.concat(Stream.of(n),
				n.children().stream().flatMap(i -> i.accept(this)));
	}
	@Override
	public Stream<Node> visitRootNode(RootNode n) {
		return Stream.empty();
	}
	
	public static NodeVisitor<Stream<Node>> get(){
		return new Flattener();
	}

}
